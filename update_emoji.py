import pandas as pd
import json
import os

df = pd.read_excel(r'C:\Users\Qin_zzq\Desktop\宠物.xlsx')
mapping = json.load(open(r'c:\Users\Qin_zzq\Desktop\program\PetsClass_I\classroom-pet-system-main\pet_import_mapping.json', encoding='utf-8'))

# 遍历Excel，找到所有学生的emoji
emoji_map = {}
for col in range(0, len(df.columns), 2):
    name_col = col
    emoji_col = col + 2
    if emoji_col < len(df.columns):
        for row in range(len(df)):
            name = df.iloc[row, name_col]
            if pd.notna(name):
                emoji = df.iloc[row, emoji_col]
                emoji_map[str(name).strip()] = str(emoji) if pd.notna(emoji) else None

# 更新mapping中的emoji
for student_name, student_data in mapping['students'].items():
    emoji = emoji_map.get(student_name)
    if emoji and emoji not in ['nan', 'None', '？']:
        student_data['emoji'] = emoji
    else:
        student_data['emoji'] = None

# 为unmatched学生添加emoji
for name in mapping['unmatched_students']:
    emoji = emoji_map.get(name)
    if emoji and emoji not in ['nan', 'None', '？']:
        mapping['students'][name] = {
            'excel_pet': None,
            'images': [],
            'primary_image': None,
            'has_multi_states': False,
            'generic_assigned': False,
            'emoji': emoji
        }
    else:
        mapping['students'][name] = {
            'excel_pet': None,
            'images': [],
            'primary_image': None,
            'has_multi_states': False,
            'generic_assigned': False,
            'emoji': None
        }

# 保存
with open(r'c:\Users\Qin_zzq\Desktop\program\PetsClass_I\classroom-pet-system-main\pet_import_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print('emoji更新完成')
print('unmatched学生的emoji:')
for name in mapping['unmatched_students']:
    data = mapping['students'].get(name, {})
    e = data.get('emoji', '无')
    print(f'  {name}: {e}')
