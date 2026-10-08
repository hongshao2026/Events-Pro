import content from './legal-content.json';
import releaseInfo from '../app-release.config.json';

export type LegalPage='privacy'|'support'|'terms';
export type LegalLanguage='zh-CN'|'zh-Hant';
export {releaseInfo};
export const releaseContactReady=!!(releaseInfo.operatorName.trim()&&releaseInfo.operatorCountry.trim()&&releaseInfo.supportEmail.trim());
export function legalPage(page:LegalPage,language:LegalLanguage='zh-CN'){
  const values:Record<string,string>={...releaseInfo,
    operatorName:releaseInfo.operatorName||(language==='zh-Hant'?'尚未設定':'尚未配置'),
    operatorCountry:releaseInfo.operatorCountry||(language==='zh-Hant'?'待確認':'待确认'),
    supportEmail:releaseInfo.supportEmail||(language==='zh-Hant'?'支援信箱尚未設定':'支持邮箱尚未配置'),
  };
  const fill=(text:string)=>text.replace(/\{\{(\w+)\}\}/g,(_match,key:string)=>values[key]||'');
  const source=content[language][page];
  return {title:source.title,intro:fill(source.intro),sections:source.sections.map(section=>({heading:section.heading,paragraphs:section.paragraphs.map(fill)}))};
}
