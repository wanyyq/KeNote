#!/usr/bin/env python3
"""
KeNote 测试数据生成器
生成大量账单数据用于测试 IndexedDB 性能

使用方法:
    python make-test.py [数量]
    
示例:
    python make-test.py 1000     # 生成 1000 条账单
    python make-test.py 10000    # 生成 10000 条账单
"""

import json
import random
import sys
import uuid
from datetime import datetime, timedelta

# 默认分类
EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '住房', '医疗', '教育', '数码', '其他']
INCOME_CATEGORIES = ['工资', '奖金', '投资', '兼职', '理财', '其他']

def generate_bills(count: int) -> list:
    """生成指定数量的账单数据"""
    bills = []
    now = datetime.now()
    
    # 生成 ID 计数器
    bill_counter = int(now.timestamp() * 1000)
    
    for i in range(count):
        # 随机类型
        bill_type = random.choice(['income', 'expense'])
        
        # 根据类型选择分类
        if bill_type == 'income':
            category = random.choice(INCOME_CATEGORIES)
        else:
            category = random.choice(EXPENSE_CATEGORIES)
        
        # 随机金额 (1-100)
        amount = round(random.uniform(1, 100), 2)
        
        # 使用 UUID 作为备注
        note = str(uuid.uuid4())[:8]  # 取前8位
        
        # 随机日期 (过去一年内)
        days_ago = random.randint(0, 365)
        date_obj = now - timedelta(days=days_ago)
        date_str = date_obj.strftime('%Y-%m-%d')
        
        # 创建时间戳 (用于排序)
        created_at = int((now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))).timestamp() * 1000)
        
        # 生成 ID
        bill_counter += 1
        bill_id = f"bill_{bill_counter}_{uuid.uuid4().hex[:7]}"
        
        bill = {
            "id": bill_id,
            "type": bill_type,
            "amount": amount,
            "category": category,
            "note": note,
            "date": date_str,
            "createdAt": created_at
        }
        bills.append(bill)
    
    # 按创建时间降序排序 (最新的在前)
    bills.sort(key=lambda x: x['createdAt'], reverse=True)
    
    return bills

def main():
    # 获取数量参数
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            print("错误: 数量必须是整数")
            sys.exit(1)
    else:
        count = 100  # 默认 100 条
    
    print(f"正在生成 {count} 条测试账单...")
    
    # 生成账单
    bills = generate_bills(count)
    
    # 构建导出数据结构
    data = {
        "version": 2,
        "exportedAt": datetime.now().isoformat(),
        "bills": bills,
        "settings": {
            "currency": "¥"
        },
        "customExpenseCategories": [],
        "customIncomeCategories": []
    }
    
    # 生成文件名
    filename = f"test_data_{count}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    # 写入文件
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # 统计信息
    income_count = sum(1 for b in bills if b['type'] == 'income')
    expense_count = count - income_count
    total_income = sum(b['amount'] for b in bills if b['type'] == 'income')
    total_expense = sum(b['amount'] for b in bills if b['type'] == 'expense')
    
    print(f"\n生成完成!")
    print(f"文件: {filename}")
    print(f"总条数: {count}")
    print(f"收入: {income_count} 条, 共 {total_income:.2f} 元")
    print(f"支出: {expense_count} 条, 共 {total_expense:.2f} 元")
    print(f"\n导入方法:")
    print(f"  1. 打开 KeNote 应用")
    print(f"  2. 进入控制台 -> 设备同步")
    print(f"  3. 点击「合并同步数据」选择此文件")

if __name__ == '__main__':
    main()