## 目标
- 将当前工作区的变更以一次规范化提交记录，并推送到远端同名分支
- 保持历史干净：仅包含源码与配置改动，不包含构建产物与临时文件

## 前置检查（只读）
- 查看当前分支与变更概况：
  - `git branch --show-current`
  - `git status`
  - `git remote -v`
- 若存在未保存文件，我会先确保它们已写入磁盘再继续

## 提交策略
- 采用一次提交，信息遵循 Conventional Commits：
  - 默认信息：`chore: sync local changes`
  - 如检测到明确范围（例如仅改动 renderer 界面），将采用：`feat(renderer): update UI changes` 或 `fix(renderer): ...`（按变更类型自动选择）
- 仅纳入需要跟踪的文件：排除 `node_modules/`、`dist/`、缓存与日志
- 暂存与提交命令：
  - `git add -A`
  - `git commit -m "chore: sync local changes"`

## 推送策略
- 先与远端同步以降低冲突概率：`git pull --rebase`
- 推送到远端 `origin` 的当前分支（保持同名）：
  - `git push -u origin $(git branch --show-current)`
- 一次性串行执行（Windows PowerShell，用分号连接）：
  - `git status; git pull --rebase; git add -A; git commit -m "chore: sync local changes"; git push -u origin $(git branch --show-current)`

## 冲突与回滚策略
- 若 `pull --rebase` 出现冲突：
  - 按文件逐一解决后：`git add -A; git rebase --continue`
  - 若需要放弃本次变更：`git rebase --abort`
- 若推送被拒绝（远端有新提交）：
  - 再次 `git pull --rebase`，解决冲突后重试 `git push`

## 后续动作
- 完成后回显当前提交哈希与远端分支
- 记录本次对话要点到记忆系统（不涉及代码库）

请确认是否按以上步骤执行。如果需要自定义提交信息或指定远端/分支名，请告知；否则我将按该计划进行。