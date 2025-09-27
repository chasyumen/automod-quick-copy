import { AllowedMentionsTypes, GatewayIntentBits, Client, Guild, GuildMember, TextChannel, User, Events, AutoModerationRuleCreateOptions, AutoModerationActionOptions, GuildBasedChannel, TextBasedChannel } from "discord.js";
import { config as ConfigDotEnv } from "dotenv";
import config from "./../config.json" with { type: "json" };

ConfigDotEnv({ quiet: true });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    allowedMentions: {
        repliedUser: false
    }
});

client.on(Events.ClientReady, async () => {
    console.log(`Starting process...`);
    const cloneSourceGuild = client.guilds.cache.get(config.source_guild_id);
    if (!cloneSourceGuild) {
        console.log("\x1b[31mSource guild ID is invalid\x1b[0m");
        return exit();
    }
    console.log(`Clone source guild is: ${cloneSourceGuild.name} (${cloneSourceGuild.id})`);
    const cloneTargetGuild = client.guilds.cache.get(config.target_guild_id);
    if (!cloneTargetGuild) {
        console.log("\x1b[31mTarget guild ID is invalid.\x1b[0m");
        return exit();
    }
    console.log(`Clone target guild is: ${cloneTargetGuild.name} (${cloneTargetGuild.id})`);
    let alterChannelOverride: TextBasedChannel | null = null;
    if (config.alert_channel_override_id !== null) {
        let targetChannel = cloneTargetGuild.channels.cache.get(config.alert_channel_override_id);
        if (targetChannel && targetChannel.isTextBased()) {
            alterChannelOverride = targetChannel;
            console.log(`Alert channel override is set to ${targetChannel.name} (${targetChannel.id})`);
        }
    }
    try {
        const sourceAutomodData = await cloneSourceGuild.autoModerationRules.fetch();
        if (!sourceAutomodData) {
        console.log("Source guild automod rule fetch failed.");
        return exit();
    }
        const targetAutomodData = await cloneTargetGuild.autoModerationRules.fetch();
        if (!targetAutomodData) {
        console.log("Target guild automod rule fetch failed.");
        return exit();
    }
        const cloneFormattedData: AutoModerationRuleCreateOptions[] = sourceAutomodData.map(automodSource => {
            let automodToSet: AutoModerationRuleCreateOptions = {
                name: automodSource.name,
                eventType: automodSource.eventType,
                triggerType: automodSource.triggerType,
                actions: [],
                triggerMetadata: automodSource.triggerMetadata,
                enabled: automodSource.enabled
            };

            automodToSet["actions"] = automodSource.actions.map(automodSourceAction => {
                let automodSaveAction = ((automodSourceAction) => {
                    const returnAction: AutoModerationActionOptions = {
                        type: automodSourceAction.type
                    };
                    if (automodSourceAction.metadata.customMessage || automodSourceAction.metadata.durationSeconds) {
                        returnAction["metadata"] = {};
                        if (automodSourceAction.metadata.customMessage) returnAction["metadata"]["customMessage"] = automodSourceAction.metadata.customMessage;
                        if (automodSourceAction.metadata.durationSeconds) returnAction["metadata"]["durationSeconds"] = automodSourceAction.metadata.durationSeconds;
                    };
                    return returnAction;
                })(automodSourceAction);
                if (automodSourceAction.type !== 2) return automodSaveAction;

                if (alterChannelOverride) {
                    if (!automodSaveAction.metadata) automodSaveAction.metadata = {};
                    automodSaveAction.metadata.channel = alterChannelOverride.id;
                    return automodSaveAction;
                }

                if (!automodSourceAction.metadata.channelId) return null;
                if (!cloneSourceGuild.channels.cache.has(automodSourceAction.metadata.channelId)) return null;
                let sourceChannel = cloneSourceGuild.channels.cache.get(automodSourceAction.metadata.channelId);
                if (!sourceChannel) return null;
                let targetGuildChannel = cloneTargetGuild.channels.cache.filter(x => x.isTextBased()).find(targetChannel => sourceChannel.name == targetChannel.name);
                if (!targetGuildChannel) return null;
                if (!automodSaveAction.metadata) automodSaveAction.metadata = {};
                automodSaveAction.metadata.channel = targetGuildChannel.id;
                return automodSaveAction;
            }).filter(x => x !== null);

            automodToSet["exemptChannels"] = automodSource.exemptChannels.filter(sourceChannel => 1 <= cloneTargetGuild.channels.cache.filter(targetChannel => sourceChannel.name == targetChannel.name).size).map(sourceChannel => {
                const targetChannel = cloneTargetGuild.channels.cache.filter(x => x.isTextBased()).find(targetChannel => sourceChannel.name == targetChannel.name);
                if (!targetChannel) return null;
                return targetChannel.id;
            }).filter(x => x !== null);

            return automodToSet;
        });

        console.log(`${cloneFormattedData.length} rules were detected from ${cloneSourceGuild.name} (${cloneSourceGuild.id}).`);

        for (const data of cloneFormattedData) {
            let automodExistingRule = cloneTargetGuild.autoModerationRules.cache.find(rl => rl.name == data.name);
            if (automodExistingRule) {
                console.log(`\x1b[32mRule ${data.name} was found on the target server. It will be updated\x1b[0m`);
            } else {
                console.log(`\x1b[33mRule ${data.name} was not found on the target server. It will be created\x1b[0m`);
            }
        }

        console.log(`Rules will be applied to ${cloneTargetGuild.name} (${cloneTargetGuild.id}) in 10 seconds. If you don't wish it, press Ctrl+C to cancel.`);

        await (new Promise((resolve) => setTimeout(resolve, 10000)));

        console.log(`Applying automod rules to ${cloneTargetGuild.name} (${cloneTargetGuild.id})...`);

        for (const data of cloneFormattedData) {
            try {
                let automodExistingRule = cloneTargetGuild.autoModerationRules.cache.find(rl => rl.name == data.name);
                if (automodExistingRule) {
                    await automodExistingRule.edit(data);
                    console.log(`\x1b[32mUpdated automod rule: ` + data.name + "\x1b[0m");
                } else {
                    await cloneTargetGuild.autoModerationRules.create(data);
                    console.log(`\x1b[33mCreated automod rule: ` + data.name + "\x1b[0m");
                }
            } catch (err) {
                console.error(`\x1b[31mFailed to create automod rule: ` + data.name + "\x1b[0m");
                console.log(err);
            }
        }
    } catch (err) {
        throw new Error(`Error occured: ${err}`)
    }
    console.log("Process finished");
    exit();
});

async function exit() {
    await client.destroy();
    process.exit(0);
}

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", async () => {
    console.log("interrupted");
    await client.destroy();
    process.exit(0);
});