# -*- coding: utf-8 -*-
"""
宠物图片批量导入工具 v4
最终版：复制图片到项目目录，生成导入脚本
"""

import os
import re
import json
import random
import shutil
import pandas as pd
from pathlib import Path

# 配置路径
EXCEL_PATH = r'C:\Users\Qin_zzq\Desktop\宠物.xlsx'
FOLDER_PATH = r'C:\Users\Qin_zzq\Desktop\宠物'
OUTPUT_DIR = r'C:\Users\Qin_zzq\Desktop\program\PetsClass_I\classroom-pet-system-main'
PETS_DIR = os.path.join(OUTPUT_DIR, 'assets', 'pets')

def normalize_name(name):
    return name.replace(' ', '').replace('　', '')

def read_excel_pairs():
    df = pd.read_excel(EXCEL_PATH)
    pairs = {}
    emojis = {}
    for row_idx in range(len(df)):
        for col_idx in range(0, len(df.columns), 2):
            if col_idx + 1 < len(df.columns):
                student = df.iloc[row_idx, col_idx]
                pet = df.iloc[row_idx, col_idx + 1]
                emoji_col = col_idx + 2
                emoji = df.iloc[row_idx, emoji_col] if emoji_col < len(df.columns) else None
                if pd.notna(student) and pd.notna(pet):
                    student = str(student).strip()
                    pet = str(pet).strip()
                    if student in ['学生', '宠物', '猫', '狗', '狐狸', '企鹅']:
                        continue
                    if student and pet and len(student) >= 2:
                        pairs[student] = pet
                        if pd.notna(emoji):
                            e = str(emoji).strip()
                            if e not in ['nan', 'None', '？', '']:
                                emojis[student] = e
    return pairs, emojis

def find_best_match(filename, students):
    name = os.path.splitext(filename)[0]
    name_norm = normalize_name(name)
    best_match, best_len = None, 0
    for student in students:
        student_norm = normalize_name(student)
        if name_norm.startswith(student_norm) or student_norm in name_norm:
            if len(student_norm) > best_len:
                best_len = len(student_norm)
                best_match = student
    return best_match

def main():
    print("=" * 60)
    print("宠物图片批量导入工具 v4 - 最终版")
    print("=" * 60)

    # 1. 读取数据
    print("\n[1/6] 读取数据...")
    pairs, emojis = read_excel_pairs()
    files = sorted(os.listdir(FOLDER_PATH))
    print(f"    Excel: {len(pairs)} 对 | Emoji: {len(emojis)} 个 | 文件夹: {len(files)} 个文件")

    # 2. 匹配
    print("\n[2/6] 匹配学生与图片...")
    student_images = {}
    generic_images = {'猫': [], '狗': []}
    unmatched_files = []

    for f in files:
        name = os.path.splitext(f)[0]
        match = re.match(r'^(猫|狗)(\d+)$', name)
        if match:
            generic_images[match.group(1)].append({'filename': f, 'index': int(match.group(2))})
            continue

        student = find_best_match(f, pairs.keys())
        if student:
            if student not in student_images:
                student_images[student] = []
            student_images[student].append({'filename': f, 'pet_part': name[len(student):] if name.startswith(student) else name})
        else:
            unmatched_files.append(f)

    # 3. 处理多状态
    for student, images in student_images.items():
        if len(images) > 1:
            for img in images:
                name = os.path.splitext(img['filename'])[0]
                parts = name.split('_')
                img['state'] = parts[-1] if len(parts) > 1 else 'default'
                img['is_multi'] = True

    # 4. 分配大众宠物
    print("\n[3/6] 分配大众宠物...")
    needed_generic = []
    for student, pet in pairs.items():
        if student not in student_images:
            prefer = '猫' if pet in ['猪', '蜘蛛', '狼', '鹿', 'dog', '兔子', '企鹅', '仓鼠', '狐狸', '猫', '狗'] else '猫'
            needed_generic.append((student, prefer))

    for student, prefer in needed_generic:
        available = generic_images.get(prefer, generic_images['猫'])
        if available:
            img = available.pop(0)
            student_images[student] = [{'filename': img['filename'], 'generic_assigned': True, 'original_pet': pairs[student]}]

    print(f"    已分配 {len(needed_generic)} 个大众宠物")

    # 5. 复制图片到项目目录
    print("\n[4/6] 复制图片到项目目录...")
    os.makedirs(PETS_DIR, exist_ok=True)

    import_data = []
    used_files = set()

    for student, images in student_images.items():
        excel_pet = pairs.get(student, '')
        student_dir = os.path.join(PETS_DIR, student)
        os.makedirs(student_dir, exist_ok=True)

        image_paths = []
        for img in images:
            src = os.path.join(FOLDER_PATH, img['filename'])
            ext = os.path.splitext(img['filename'])[1]
            dst_name = f"{student}{ext}"
            dst = os.path.join(student_dir, dst_name)

            if os.path.exists(src):
                shutil.copy2(src, dst)
                image_paths.append(f"assets/pets/{student}/{dst_name}")
                used_files.add(img['filename'])
            else:
                # 尝试其他格式
                for ext in ['.png', '.jpg', '.jpeg', '.webp', '.PNG', '.JPG', '.WEBP']:
                    src_alt = src.replace(os.path.splitext(src)[1], ext)
                    if os.path.exists(src_alt):
                        shutil.copy2(src_alt, dst)
                        image_paths.append(f"assets/pets/{student}/{dst_name}")
                        used_files.add(img['filename'])
                        break

        import_data.append({
            'student': student,
            'excel_pet': excel_pet,
            'emoji': emojis.get(student, None),
            'images': image_paths,
            'primary_image': image_paths[0] if image_paths else None,
            'has_multi': len(images) > 1,
            'generic_assigned': images[0].get('generic_assigned', False),
            'states': {img['filename']: img.get('state', 'default') for img in images if img.get('state')}
        })

    print(f"    复制完成，已处理 {len(import_data)} 个学生")

    # 6. 生成导入数据
    print("\n[5/6] 生成导入数据...")

    # 最终导入数据（用于 JavaScript）
    # 为未匹配的学生也添加 emoji（用于显示）
    unmatched_students = [s for s in pairs.keys() if s not in student_images]
    for s in unmatched_students:
        emoji = emojis.get(s)
        import_data.append({
            'student': s,
            'excel_pet': pairs.get(s, ''),
            'emoji': emoji,
            'images': [],
            'primary_image': None,
            'has_multi': False,
            'generic_assigned': False,
            'states': {}
        })

    import_js = {
        'students': import_data,
        'unmatched_excel': unmatched_students,
        'unmatched_files': unmatched_files,
        'generic_used': {
            '猫': [img['filename'] for img in generic_images['猫'] if img['filename'] in used_files],
            '狗': [img['filename'] for img in generic_images['狗'] if img['filename'] in used_files]
        }
    }

    # 保存 JSON
    json_path = os.path.join(OUTPUT_DIR, 'pet_import_data.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(import_js, f, ensure_ascii=False, indent=2)
    print(f"    JSON 已保存: {json_path}")

    # 生成 JavaScript 导入脚本
    js_path = os.path.join(OUTPUT_DIR, 'js', 'pet_import.js')
    js_content = '''// ===== 宠物图片批量导入数据 =====
// 由 import_pets.py 自动生成
// 生成时间: ''' + pd.Timestamp.now().isoformat() + '''

const PET_IMPORT_DATA = ''' + json.dumps(import_js, ensure_ascii=False, indent=2) + ''';

/**
 * 批量导入学生宠物数据
 * 调用方式: PetImport.run()
 */
const PetImport = {
  /**
   * 运行批量导入
   * @param {Object} options 配置选项
   * @param {boolean} options.overwrite 是否覆盖已有宠物
   * @param {boolean} options.lockPairings 是否锁定配对（锁定后大众宠物不再随机分配）
   */
  run(options = {}) {
    const { overwrite = false, lockPairings = true } = options;
    let imported = 0, skipped = 0;

    for (const data of PET_IMPORT_DATA.students) {
      // 查找学生
      const student = Store.state.students.find(s => s.name === data.student);
      if (!student) {
        console.warn(`[PetImport] 未找到学生: ${data.student}`);
        continue;
      }

      // 检查是否已有宠物
      if (student.petType && !overwrite) {
        skipped++;
        continue;
      }

      // 设置宠物类型（简化处理，实际可能需要根据 excel_pet 映射）
      if (data.primary_image) {
        // 设置宠物图片路径
        student.petImage = data.primary_image;
        student.petImages = data.images;
        student.petStates = data.states || {};
        student.petImageLocked = lockPairings && data.generic_assigned;
      }

      imported++;
    }

    // 保存到 IndexedDB
    Store.save();

    return { imported, skipped, total: PET_IMPORT_DATA.students.length };
  },

  /**
   * 获取导入统计
   */
  getStats() {
    return {
      total: PET_IMPORT_DATA.students.length,
      withImages: PET_IMPORT_DATA.students.filter(s => s.primary_image).length,
      genericAssigned: PET_IMPORT_DATA.students.filter(s => s.generic_assigned).length,
      multiState: PET_IMPORT_DATA.students.filter(s => s.has_multi).length,
      unmatchedExcel: PET_IMPORT_DATA.unmatched_excel.length,
      unmatchedFiles: PET_IMPORT_DATA.unmatched_files.length
    };
  },

  /**
   * 列出所有可导入的学生
   */
  listStudents() {
    return PET_IMPORT_DATA.students.map(s => ({
      name: s.student,
      pet: s.excel_pet,
      hasImage: !!s.primary_image,
      generic: s.generic_assigned
    }));
  }
};

console.log('[PetImport] 已加载，可通过 PetImport.run() 执行导入');
'''

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print(f"    JS 已保存: {js_path}")

    # 7. 生成 HTML 导入界面
    print("\n[6/6] 生成导入界面...")

    html_path = os.path.join(OUTPUT_DIR, 'pet_import.html')
    html_content = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>宠物图片批量导入</title>
  <style>
    body {{ font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }}
    .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
    h1 {{ color: #333; }}
    .stats {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }}
    .stat {{ background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }}
    .stat-value {{ font-size: 2em; font-weight: bold; color: #4CAF50; }}
    .stat-label {{ color: #666; font-size: 0.9em; }}
    .btn {{ padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 5px; }}
    .btn-primary {{ background: #4CAF50; color: white; }}
    .btn-primary:hover {{ background: #45a049; }}
    .btn-secondary {{ background: #2196F3; color: white; }}
    .btn-secondary:hover {{ background: #1976D2; }}
    .student-list {{ max-height: 400px; overflow-y: auto; margin-top: 20px; }}
    .student-item {{ padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }}
    .student-item:hover {{ background: #f8f9fa; }}
    .student-name {{ font-weight: bold; }}
    .student-pet {{ color: #666; }}
    .badge {{ padding: 3px 8px; border-radius: 12px; font-size: 12px; }}
    .badge-generic {{ background: #FFC107; color: #333; }}
    .badge-multi {{ background: #9C27B0; color: white; }}
    .badge-noimage {{ background: #F44336; color: white; }}
    .log {{ background: #263238; color: #aed581; padding: 15px; border-radius: 5px; margin-top: 20px; font-family: monospace; max-height: 200px; overflow-y: auto; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>🐾 宠物图片批量导入</h1>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="total">-</div>
        <div class="stat-label">总学生数</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="withImages">-</div>
        <div class="stat-label">有图片</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="generic">-</div>
        <div class="stat-label">大众宠物</div>
      </div>
    </div>

    <div>
      <button class="btn btn-primary" onclick="runImport()">▶ 执行导入</button>
      <button class="btn btn-secondary" onclick="showList()">📋 查看列表</button>
    </div>

    <div class="student-list" id="studentList"></div>

    <div class="log" id="log"></div>
  </div>

  <script src="js/data.js"></script>
  <script src="js/store.js"></script>
  <script src="js/pet_import.js"></script>
  <script>
    const $ = id => document.getElementById(id);

    function log(msg) {{
      const logEl = $('log');
      logEl.innerHTML += new Date().toLocaleTimeString() + ' ' + msg + '<br>';
      logEl.scrollTop = logEl.scrollHeight;
    }}

    async function init() {{
      await Store.init();
      while (!Store.state._initialized) await new Promise(r => setTimeout(r, 50));

      const stats = PetImport.getStats();
      $('total').textContent = stats.total;
      $('withImages').textContent = stats.withImages;
      $('generic').textContent = stats.genericAssigned;

      log('数据已加载，共 ' + stats.total + ' 个学生待导入');
    }}

    function runImport() {{
      log('开始导入...');
      const result = PetImport.run({{ overwrite: false, lockPairings: true }});
      log('导入完成: 成功 ' + result.imported + ', 跳过 ' + result.skipped);
    }}

    function showList() {{
      const list = PetImport.listStudents();
      const html = list.map(s => "<div class='student-item'><div><span class='student-name'>" + s.name + "</span><span class='student-pet'> → " + s.pet + "</span></div><div>" + (s.generic ? "<span class='badge badge-generic'>大众</span>" : "") + (s.hasImage ? "" : "<span class='badge badge-noimage'>无图</span>") + "</div></div>").join("");
      $('studentList').innerHTML = html;
    }}

    init();
  </script>
</body>
</html>
'''

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"    HTML 已保存: {html_path}")

    # 输出摘要
    print("\n" + "=" * 60)
    print("导入工具生成完成！")
    print("=" * 60)
    print(f"\n📁 生成文件:")
    print(f"   - {json_path}")
    print(f"   - {js_path}")
    print(f"   - {html_path}")
    print(f"\n📂 宠物图片目录: {PETS_DIR}")
    print(f"\n📊 统计:")
    print(f"   - 总学生: {len(import_data)}")
    print(f"   - 有图片: {len([x for x in import_data if x['primary_image']])}")
    print(f"   - 大众宠物: {len([x for x in import_data if x['generic_assigned']])}")
    print(f"   - 多状态: {len([x for x in import_data if x['has_multi']])}")

if __name__ == '__main__':
    main()
