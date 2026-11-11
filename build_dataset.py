import fitz
import re
import json

pdf_path = r'c:\Users\Admin\AppData\Local\Temp\MicrosoftEdgeDownloads\531ac4b0-4e0b-42d8-ba1f-d809de3d8f3e\lí-luận-tdtt-1-6-1.pdf'
doc = fitz.open(pdf_path)

chars = []
for pno, page in enumerate(doc):
    blocks = page.get_text('dict')['blocks']
    for b in blocks:
        if 'lines' in b:
            for l in b['lines']:
                for s in l['spans']:
                    is_red = (hex(s['color']) == '0xff0000')
                    for ch in s['text']:
                        chars.append((ch, is_red, pno + 1))
                chars.append(('\n', False, pno + 1))

full_str = ''.join(c[0] for c in chars)
de_positions = list(re.finditer(r'ĐỀ\s+SỐ\s+(\d+)', full_str, re.IGNORECASE))

def parse_options(q_text):
    letters = ['A', 'B', 'C', 'D', 'E']
    opts = []
    pos = 0
    for l in letters:
        m = re.search(r'(?:^|\n|\s+)(' + l + r')[\.:\)]\s*', q_text[pos:])
        if not m:
            break
        actual_start = pos + m.start()
        actual_end = pos + m.end()
        opts.append((actual_start, actual_end, l))
        pos = actual_end
    return opts

questions = []
global_id = 1

for i, de in enumerate(de_positions):
    d_num = int(de.group(1))
    de_start = de.start()
    de_end = de_positions[i+1].start() if i+1 < len(de_positions) else len(full_str)
    sub_text = full_str[de_start:de_end]
    cau_matches = list(re.finditer(r'Câu\s+(\d+)[:.]', sub_text))
    
    for j, cm in enumerate(cau_matches):
        q_num = int(cm.group(1))
        q_start = de_start + cm.start()
        q_end = de_start + (cau_matches[j+1].start() if j+1 < len(cau_matches) else (de_end - de_start))
        q_chars = chars[q_start:q_end]
        q_text = ''.join(c[0] for c in q_chars)
        
        opt_spans = parse_options(q_text)
        
        if not opt_spans:
            # Fill in blank question
            red_txt = ''.join(c[0] for c in q_chars if c[1]).replace('.', '').strip()
            prompt_clean = re.sub(r'Câu\s+\d+[:.]\s*', '', q_text)
            
            # Remove answer and dots from prompt
            prompt_clean = re.sub(r'\.{2,}.*?\.{2,}', ' [ ... ] ', prompt_clean)
            prompt_clean = re.sub(r'\.\.cường độ\.+', ' [ ... ] ', prompt_clean)
            prompt_clean = re.sub(r'\s+', ' ', prompt_clean).strip()
            
            mcq_options = []
            if d_num == 2 and q_num == 5:
                mcq_options = [
                    {'key': 'A', 'text': 'Động tác', 'isCorrect': True},
                    {'key': 'B', 'text': 'Di chuyển', 'isCorrect': False},
                    {'key': 'C', 'text': 'Tư thế', 'isCorrect': False},
                    {'key': 'D', 'text': 'Phản xạ', 'isCorrect': False}
                ]
            elif d_num in (4, 5) and q_num == 5:
                mcq_options = [
                    {'key': 'A', 'text': 'Hoạt động', 'isCorrect': False},
                    {'key': 'B', 'text': 'Vận động', 'isCorrect': False},
                    {'key': 'C', 'text': 'Khối lượng', 'isCorrect': False},
                    {'key': 'D', 'text': 'Cường độ', 'isCorrect': True}
                ]
            elif d_num == 6 and q_num == 5:
                mcq_options = [
                    {'key': 'A', 'text': 'Chính xác', 'isCorrect': True},
                    {'key': 'B', 'text': 'Kịp thời', 'isCorrect': False},
                    {'key': 'C', 'text': 'Nhanh chóng', 'isCorrect': False},
                    {'key': 'D', 'text': 'Linh hoạt', 'isCorrect': False}
                ]
            
            correct_key = [o['key'] for o in mcq_options if o['isCorrect']][0]
            
            questions.append({
                'id': global_id,
                'exam': d_num,
                'q_num': q_num,
                'type': 'fill_blank',
                'question': prompt_clean,
                'fill_answer': red_txt,
                'options': mcq_options,
                'correct': correct_key
            })
            global_id += 1
            continue
            
        prompt_raw = q_text[:opt_spans[0][0]]
        prompt_clean = re.sub(r'Câu\s+\d+[:.]\s*', '', prompt_raw)
        prompt_clean = re.sub(r'\s+', ' ', prompt_clean).strip()
        
        options = []
        for k, (o_s, o_e, o_l) in enumerate(opt_spans):
            next_start = opt_spans[k+1][0] if k+1 < len(opt_spans) else len(q_text)
            opt_sub_chars = q_chars[o_s:next_start]
            red_count = sum(1 for c in opt_sub_chars if c[1] and c[0].isalnum())
            opt_txt = q_text[o_e:next_start]
            opt_clean = re.sub(r'\s+', ' ', opt_txt).strip()
            options.append({
                'key': o_l,
                'text': opt_clean,
                'red_count': red_count
            })
            
        best = max(options, key=lambda x: x['red_count'])
        correct_letter = best['key']
        
        formatted_options = []
        for o in options:
            formatted_options.append({
                'key': o['key'],
                'text': o['text'],
                'isCorrect': (o['key'] == correct_letter)
            })
            
        questions.append({
            'id': global_id,
            'exam': d_num,
            'q_num': q_num,
            'type': 'choice',
            'question': prompt_clean,
            'options': formatted_options,
            'correct': correct_letter
        })
        global_id += 1

print(f"Total processed questions: {len(questions)}")

# Write to questions.json
with open('c:/Users/Admin/Desktop/lltdtt/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

# Write to questions.js
with open('c:/Users/Admin/Desktop/lltdtt/questions.js', 'w', encoding='utf-8') as f:
    f.write('const QUIZ_QUESTIONS = ' + json.dumps(questions, ensure_ascii=False, indent=2) + ';\n')

print("Regenerated questions.json and questions.js with option E support!")
