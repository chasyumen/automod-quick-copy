import { AllowedMentionsTypes, GatewayIntentBits, Client, Guild, GuildMember, TextChannel, User, Events, AutoModerationRuleCreateOptions, AutoModerationActionOptions } from "discord.js";
import { config } from "dotenv";

config({ quiet: true });

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
    const cloneSourceGuild = client.guilds.cache.get("1330457097447407707");
    const cloneTargetGuild = client.guilds.cache.get("1330457145107419167");
    if (!cloneSourceGuild || !cloneTargetGuild) return console.log("Either or both of source or target guild ID is invalid.")
    try {
        const sourceAutomodData = await cloneSourceGuild.autoModerationRules.fetch();
        if (!sourceAutomodData) return;
        const targetAutomodData = await cloneTargetGuild.autoModerationRules.fetch();
        if (!targetAutomodData) return;
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

                if (!automodSourceAction.metadata.channelId) return null;
                if (!cloneSourceGuild.channels.cache.has(automodSourceAction.metadata.channelId)) return null;
                let sourceChannel = cloneSourceGuild.channels.cache.get(automodSourceAction.metadata.channelId);
                if (!sourceChannel) return null;
                let targetGuildChannel = cloneTargetGuild.channels.cache.filter(x => x.isTextBased()).find(targetChannel => sourceChannel.name == targetChannel.name);
                if (!targetGuildChannel) return null;
                if (!automodSaveAction.metadata) automodSaveAction.metadata = {};
                automodSaveAction.metadata.channel = targetGuildChannel.id;
                return automodSaveAction
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
    await client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", async () => {
    console.log("interrupted");
    await client.destroy();
    process.exit(0);
});