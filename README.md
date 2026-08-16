# dsh-feishu-codem

**Use Feishu CodeM as the LLM provider for DeepSeek Harness (DSH) — no paid API key needed.**

让**原生 DeepSeek Harness（DSH）**使用**飞书 CodeM** 作为模型 Provider，彻底免去 DeepSeek 官方付费额度。

> dsh-feishu-codem is a lightweight DSH plugin that lets you drive DeepSeek Harness with Feishu's CodeM as your model provider, completely removing the need for a paid DeepSeek API key. It is built on DSH's Cordis plugin system as a standard npm bundle: a single `cordis.patch.yml` registers a `codem` provider pointing to CodeM's OpenAI-compatible endpoint (`codem.feishu.cn/models/v1`). After installation, your default model becomes `codem-router/auto`, billed through your Feishu account's AI quota. The plugin ships with a credential sync script that reads your CodeM accessToken from `~/.codem/.credentials.json` and writes it into DSH's credentials file — DSH hot-reloads credentials, so token updates take effect on the next request without a restart. Installation is one command (`dsh plugin add`) and works with any profile (web, headless, or custom). If you already have a Feishu account, this is the fastest way to run DSH for free.
>
> dsh-feishu-codem 是一款轻量级 DSH 插件，让你用飞书 CodeM 作为模型 Provider 来驱动 DeepSeek Harness，彻底省去付费的 DeepSeek API Key。它基于 DSH 的 Cordis 插件体系，是一个标准 npm bundle：一份 `cordis.patch.yml` 注册名为 `codem` 的 Provider，指向 CodeM 的 OpenAI 兼容接口（`codem.feishu.cn/models/v1`）。安装后默认模型即为 `codem-router/auto`，按你的飞书账号 AI 额度计费。插件自带凭证同步脚本，自动从 `~/.codem/.credentials.json` 读取 CodeM accessToken 并写入 DSH 的凭证文件，DSH 支持热加载，无需重启。一条 `dsh plugin add` 命令即可完成安装，兼容 web、headless 等任意 profile。只要你有飞书账号，这是让 DSH 免费跑起来的最快方式。

> **免责声明**：本项目为个人独立开发的第三方插件，与飞书（字节跳动）及其 CodeM 产品无任何关联，亦非官方出品。"飞书""CodeM" 为各自权利人的商标；CodeM 的 AI 额度由你的飞书账号提供，使用须遵守飞书服务条款。

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

> 注：下面的 `<本仓库地址>` 是占位符，push 到 GitHub 后请替换为你仓库的真实地址（形如 `https://github.com/<你的用户名>/dsh-feishu-codem.git`）。

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
