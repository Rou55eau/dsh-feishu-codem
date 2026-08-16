# dsh-feishu-codem

让**原生 DeepSeek Harness（DSH）**使用**飞书 CodeM** 作为模型 Provider，彻底免去 DeepSeek 官方付费额度。

> 只要你拥有飞书账号，就能用 CodeM 的 AI 额度驱动 DSH——这是 DeepSeek Harness 的模型 Provider 机制与飞书 CodeM 的 OpenAI 兼容接口的即插即用组合。

## 它解决什么问题

DeepSeek Harness（DSH）默认模型走 `api.deepseek.com`，需要 `DEEPSEEK_API_KEY` 付费。而飞书 CodeM 底层暴露了 OpenAI 兼容接口（`https://codem.feishu.cn/models/v1`），登录飞书即可获得 AI 额度。

本项目把这一思路封装成一个**标准 DSH 插件（profile bundle）**：

- 通过 `dsh plugin add` 一键接入原生 DSH，无需改代码、无需装凤凰之翼那种整套桌面壳；
- 自动把飞书 CodeM 的 accessToken 同步为 DSH 的凭证；
- 配置热加载，token 更新无需重启 DSH。

## 原理

DSH 采用 Cordis「一切皆插件」架构，插件本质是一个 npm 包，`package.json` 声明 `dsh.bundle.patch` 指向一个 `cordis.patch.yml` 配置补丁。`dsh plugin add` 后该补丁作为 profile 层生效。

本插件通过补丁覆盖两个已有条目：

| 条目 | 作用 |
|---|---|
| `llm-pi-ai` | 多 Provider 适配器，注册名为 `codem` 的 Provider（指向 CodeM OpenAI 兼容接口） |
| `agent-default-model` | 把默认模型改为 `codem-router/auto` |

凭证由 `scripts/sync-credentials.mjs` 从 `~/.codem/.credentials.json` 读取 accessToken，写入 `$DSH_HOME/.credentials.yaml` 的 `CODEM_API_KEY`。DSH 的 `dsh-credentials-local` 插件热加载该文件，无需重启。

## 前置条件

- 已安装 DSH：`npm install -g @deepseek-ai/dsh`
- 已安装并登录飞书 CodeM（`~/.codem/.credentials.json` 存在，访问 [codem.feishu.cn](https://codem.feishu.cn)）

## 安装

```bash
git clone <本仓库地址>
cd dsh-feishu-codem

# 一键安装（默认装到 web profile）
bash scripts/install.sh

# 其他 profile（如 headless）：
# bash scripts/install.sh headless
```

脚本会自动：① `dsh plugin add` 把插件装进 profile；② 同步 CodeM 凭证。

## 使用

```bash
dsh web          # 启动 Web 界面
dsh --profile headless "写一段冒泡排序"   # 无头模式
```

默认模型即 `codem-router/auto`，走飞书 CodeM 额度。

### 手动刷新凭证

CodeM accessToken 会过期，过期时重跑：

```bash
node scripts/sync-credentials.mjs
```

DSH 热加载凭证，无需重启。

## 目录结构

```
dsh-feishu-codem/
├── package.json             # npm 包，声明 dsh.bundle.patch
├── cordis.patch.yml         # 核心：CodeM Provider 配置补丁
├── scripts/
│   ├── install.sh           # 一键安装脚本
│   └── sync-credentials.mjs # CodeM → DSH 凭证同步
├── README.md
└── LICENSE
```

## 自定义

想改 Provider 名称/模型显示名，编辑 `cordis.patch.yml`：

- `providers.codem` 下的 `displayName`、`models[0].name`：界面显示名；
- `models[0].maxTokens`：CodeM 接口上限，默认 65536（256000 会报 400，实测 65536 最稳）；
- 若想保留 DeepSeek 官方作为备选，可把 `agent-default-model.config.provider` 改回 `deepseek-official`，并在 DSH Web 的模型选择器中切换。

## License

[MIT](LICENSE)
