# automod-quick-copy
サーバー間でのAutoMod設定の同期をスムーズに実行

⚠ 宛先のサーバーのAutoMod構成が破損、あるいは消失する可能性があります。

⚠ 使用によって発生した損害に関しての責任は負いかねます。自己責任でご利用ください。

---

### Step. 1 インストール

使用前に、 [Node.js](https://nodejs.org/en/download) をインストールしてください。

まず、次のコマンドを実行してください。

```
npm i
```

---

### Step. 2 構成設定

Discord Botのトークンが必要です。[Developer Portal](https://discord.com/developers/applications) からトークンを取得し、移行元と移行先の双方のサーバーにサーバー管理権限を付与した状態でBotを追加してください。

- .env
```
DISCORD_TOKEN= # Developer Portal内で取得したトークンを入力
```

source_guild_id に、設定の移行元のサーバーID、 target_guild_id に設定の移行先のサーバーIDを入力してください。

双方のサーバーにおいて、Botにサーバー管理権限が必要です。

- config.json
```json
{
    "source_guild_id": "",
    "target_guild_id": "",
    "alert_channel_override_id": null
}
```

#### 設定例
```json
{
    "source_guild_id": "1234567890123456789",
    "target_guild_id": "1234567890123456789",
    "alert_channel_override_id": "1234567890123456789" //optional
}
```

alert_channel_override_id は任意の設定項目です。
設定すると、すべてのルールにおけるアラートの送信先がそのチャンネルに設定されます。

---

### Step. 3 実行

```
npm start
```

変更内容を確認する時間が10秒あります。中止したい場合は、Ctrl+Cを押して操作をキャンセルできます。

---