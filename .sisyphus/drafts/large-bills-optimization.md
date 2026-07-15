# Draft: KeNote 大量账单性能优化

## 问题分析

### 当前架构
- **存储**: Zustand + localStorage persist (`kenote-storage`)，所有账单存单一 key
- **查询**: 全量 `bills.filter().reduce()` 扫描
- **渲染**: 无虚拟化，所有可见账单全量 DOM 渲染
- **持久化**: 每次状态变更都完整序列化/反序列化整个 store

### 瓶颈定位

1. **localStorage 瓶颈**:
   - 单 key 存储上限 5-10MB（浏览器相关）
   - 每条账单 JSON 约 150 bytes
   - 10,000 条 ≈ 1.5MB，20,000 条 ≈ 3MB
   - `JSON.stringify` 阻塞主线程（1.5MB 约 50-100ms）
   - Zustand persist 在每次 action 后都序列化全量数据

2. **Home.tsx 计算瓶颈**:
   - 约 12 个独立 useMemo，每个都 `bills.filter().reduce()` 全扫
   - 10,000 条 × 12 次扫描 = 120,000 次迭代
   - 每条账单的 filter 中做字符串日期比较（`b.date >= format(from, "yyyy-MM-dd")`）

3. **Timelist.tsx 渲染瓶颈**:
   - 无虚拟化，10,000 个 Card + ContextMenu + DropdownMenu = 40,000+ DOM 节点
   - 每个 Radix UI 组件有独立状态和事件监听器

4. **Store 操作 O(n)**:
   - `updateBill`: map 全数组
   - `removeBill`: filter 全数组
   - `shiftBillDate`: map + sort 全数组
   - `importData`: Set 查重

5. **无预聚合/索引**:
   - 所有聚合（按日/月/分类统计）每次都实时计算
   - 无缓存层或预计算结果

## 已确认的技术决策

1. **存储**: IndexedDB（使用 Dexie.js 简化操作）。完全浏览器本地，无需服务器
2. **列表渲染**: 虚拟滚动 + 分页加载（@tanstack/virtual）
3. **图表计算**: 预聚合缓存，增量更新
4. **数据范围**: 首页图表默认近 12 个月
5. **PWA/离线**: 保持当前离线模式，IndexedDB 天然支持

## 全部已确认的技术决策

1. **存储**: IndexedDB（Dexie.js 封装）
2. **列表渲染**: 虚拟滚动 + 分页加载（@tanstack/virtual）
3. **图表计算**: 预聚合缓存，增量更新
4. **数据范围**: 首页图表默认近 12 个月
5. **测试**: 引入 Vitest，对关键模块做单元测试
6. **数据迁移**: 首次打开自动检测 localStorage → IndexedDB 迁移
7. **离线模式**: 保持纯本地，IndexedDB 天然支持，无需服务器

## 范围边界

### IN
- IndexedDB 存储层替换（Dexie.js）
- 所有 Store action 改为异步 IndexedDB 操作
- localStorage → IndexedDB 自动迁移
- Timelist 虚拟滚动
- 预聚合缓存（按日/月/分类）
- 首页图表默认 12 月范围
- Vitest 测试基础设施 + 存储层/聚合逻辑测试

### OUT
- PWA / Service Worker（非必需，不引入复杂度）
- 后端服务器存储
- UI 重设计
- 新增业务功能（仅性能优化）
