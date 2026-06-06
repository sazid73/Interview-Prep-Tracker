import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('src').filter(f => f.endsWith('.jsx') && f !== 'SearchableSelect.jsx');
for (const file of files) {
  let fp = path.join('src', file);
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('<select') || content.includes('</select>')) {
    content = content.replace(/<select\b/g, '<SearchableSelect').replace(/<\/select>/g, '</SearchableSelect>');
    if (!content.includes('import SearchableSelect')) {
      content = "import SearchableSelect from './SearchableSelect';\n" + content;
    }
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Updated ' + file);
  }
}
