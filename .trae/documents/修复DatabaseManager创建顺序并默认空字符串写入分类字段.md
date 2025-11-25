## 变更内容
- DatabaseManager：移除rooms_meta的DROP逻辑与重复CREATE；使用单次`CREATE TABLE IF NOT EXISTS rooms_meta`并在`serialize`内顺序创建索引。
- IPC room.details与ApiProxy：分类字段`category_id/category_name/sub_category_id/sub_category_name`缺失时写入空字符串`''`（不再写NULL），以便后续查询分析；保留`like_count`写入。

## 验证
- 启动不再出现“table already exists”错误。
- 每次详情或代理调用都会插入快照，分类字段为非NULL（缺失为空字符串）。