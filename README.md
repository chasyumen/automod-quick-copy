# automod-quick-copy
Quickly copy Discord AutoMod configurations between servers

⚠ Using this might damage or disappear the whole AutoMod configurations of the target server.

⚠ I don't hold responsibility for any damages caused. Use at your own risk.

---

### Step. 1 Installation

Please download and install [Node.js](https://nodejs.org/en/download) on your computer before using this.

Please run following command within the same directory.

```
npm i
```

---

### Step. 2 Configuration

Discord Bot Token is required. Get one at [Developer Portal](https://discord.com/developers/applications) and add the bot to both source and target server with Manage Server permission.

- .env
```
DISCORD_TOKEN=ENTERYOURTOKENHERE //Replace with one you found at developer portal
```

Enter the source guild and target guild id in the config.json.

Manage server permissions are required on both servers.

config.json
```json
{
    "source_guild_id": "",
    "target_guild_id": "",
    "alert_channel_override_id": null
}
```

#### Example
```json
{
    "source_guild_id": "1234567890123456789",
    "target_guild_id": "1234567890123456789",
    "alert_channel_override_id": "1234567890123456789" //optional
}
```

Setting an alert channel override will force the rules with the alert action enabled to use that channel.

---

### Step. 3 Run

```
npm start
```

You will have 10 seconds to review what will be changed. If you saw something incorrect, you can press Ctrl+C and cancel the operation.

**If you notice something going out of ordinary, you can press Ctrl+C to interrupt the operation.**

---