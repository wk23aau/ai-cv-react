import React from 'react';
import { CVData, ThemeOptions, PersonalInfo, ExperienceEntry, EducationEntry, SkillEntry } from '../../types'; // Adjust path if necessary
import {
    PersonalInfoSection as BasePersonalInfoSection,
    SummarySection as BaseSummarySection,
    ExperienceItem as BaseExperienceItem,
    EducationItem as BaseEducationItem,
    SkillsSectionItem as BaseSkillsSectionItem,
    SectionTitle as BaseSectionTitle
} from '../CVPreview'; // Adjust path to CVPreview.tsx

// Minimalist specific SectionTitle (if different, otherwise BaseSectionTitle can be used)
const SectionTitle: React.FC<{ title: string; primaryColor?: string }> = ({ title, primaryColor }) => (
  <h2 className={`text-lg font-semibold text-gray-700 mt-6 mb-3 tracking-wide uppercase`}>
    {title}
  </h2>
);

// Minimalist PersonalInfo (re-style or simplify from BasePersonalInfoSection)
const PersonalInfoDisplay: React.FC<{ info: PersonalInfo; theme: ThemeOptions }> = ({ info, theme }) => {
  const hasContactInfo = info.showPhone || info.showEmail || info.showLinkedin || info.showGithub || info.showPortfolio;
  // Minimalist might not show portrait by default or make it very small if shown
  const displayPortrait = info.showPortrait && info.portraitUrl && theme.templateParams?.minimalist?.showPortrait;

  const contactItems: {key: string, value: string, href?:string}[] = [];
  if (info.showPhone && info.phone) contactItems.push({key: 'phone', value: info.phone});
  if (info.showEmail && info.email) contactItems.push({key: 'email', value: info.email, href: `mailto:${info.email}`});
  if (info.showLinkedin && info.linkedin) contactItems.push({key: 'linkedin', value: info.linkedin.replace(/^(https?:\/\/)?(www\.)?/i, ''), href: info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}`});
  if (info.showGithub && info.github) contactItems.push({key: 'github', value: info.github.replace(/^(https?:\/\/)?(www\.)?/i, ''), href: info.github.startsWith('http') ? info.github : `https:// ${info.github}`});
  if (info.showPortfolio && info.portfolio) contactItems.push({key: 'portfolio', value: info.portfolio.replace(/^(https?:\/\/)?(www\.)?/i, ''), href: info.portfolio.startsWith('http') ? info.portfolio : `https://${info.portfolio}`});

  return (
    <div className={`mb-6 text-center border-b border-gray-200 pb-6`}>
      {displayPortrait && (
        <img
            src={info.portraitUrl}
            alt={`${info.name}'s portrait`}
            className="w-20 h-20 object-cover rounded-full mx-auto mb-3 shadow-sm"
        />
      )}
      <h1 className={`text-3xl font-bold text-gray-800`}>{info.name}</h1>
      <p className={`text-md text-gray-600 mt-1`}>{info.title}</p>

      {hasContactInfo && (
        <div className={`mt-3 text-xs text-gray-500 flex flex-wrap justify-center items-center gap-x-3 gap-y-1`}>
          {contactItems.map((item) => (
            item.href ?
            <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">{item.value}</a> :
            <span key={item.key}>{item.value}</span>
          ))}
        </div>
      )}
      {info.showAddress && info.address && (
        <p className={`text-xs text-gray-500 mt-1`}>{info.address}</p>
      )}
    </div>
  );
};

const ExperienceItemDisplay: React.FC<{ exp: ExperienceEntry; theme: ThemeOptions }> = ({ exp, theme }) => (
  <div className="mb-4">
    <h3 className={`text-md font-semibold text-gray-700`}>{exp.jobTitle}</h3>
    <div className="flex justify-between items-baseline">
        <p className={`text-sm text-gray-600`}>{exp.company}</p>
        <p className={`text-xs text-gray-500`}>{exp.location}</p>
    </div>
    <p className={`text-xs text-gray-500 mb-1`}>{exp.startDate} - {exp.endDate}</p>
    <ul className={`list-disc list-inside ml-1 text-sm text-gray-600 space-y-0.5`}>
      {exp.responsibilities.filter(r => r.trim() !== "").map((resp, index) => <li key={index}>{resp}</li>)}
    </ul>
  </div>
);

const EducationItemDisplay: React.FC<{ edu: EducationEntry; theme: ThemeOptions }> = ({ edu, theme }) => (
  <div className="mb-3">
    <h3 className={`text-md font-semibold text-gray-700`}>{edu.degree}</h3>
     <div className="flex justify-between items-baseline">
        <p className={`text-sm text-gray-600`}>{edu.institution}</p>
        <p className={`text-xs text-gray-500`}>{edu.location}</p>
    </div>
    <p className={`text-xs text-gray-500 mb-1`}>{edu.graduationDate}</p>
    {edu.details && edu.details.filter(d => d.trim() !== "").length > 0 && (
      <ul className={`list-disc list-inside ml-1 text-sm text-gray-600 space-y-0.5`}>
        {edu.details.filter(d => d.trim() !== "").map((detail, index) => <li key={index}>{detail}</li>)}
      </ul>
    )}
  </div>
);

const SkillsSectionDisplay: React.FC<{ skills: SkillEntry[]; theme: ThemeOptions }> = ({ skills, theme }) => {
  if (skills.length === 0) return null;
  return (
    <div>
      <SectionTitle title="Skills" />
      {skills.map((skillItem) => (
        skillItem.skills.filter(s => s.trim() !== "").length > 0 && (
          <div key={skillItem.id || skillItem.category} className="mb-2">
            <h4 className={`text-sm font-medium text-gray-600`}>{skillItem.category}:</h4>
            <p className={`text-sm text-gray-500`}>{skillItem.skills.filter(s => s.trim() !== "").join(', ')}</p>
          </div>
        )
      ))}
    </div>
  );
};

interface MinimalistTemplateProps {
  cvData: CVData;
  theme: ThemeOptions; // theme.primaryColor could be used for subtle accents if desired
}

const MinimalistTemplate: React.FC<MinimalistTemplateProps> = ({ cvData, theme }) => {
  const { personalInfo, summary, experience, education, skills } = cvData;
  const effectiveFont = theme.fontFamily || 'font-sans'; // Default to sans-serif

  return (
    <div
        id="cv-content-formatted" // Required for PDF generation
        className={`p-8 bg-white text-gray-800 ${effectiveFont} max-w-4xl mx-auto`}
        style={{
            // A4 dimensions: 210mm x 297mm. Using approx conversion for screen.
            // Padding is handled by the 'p-8'. Actual A4 scaling is done by html2pdf.
            width: '210mm',
            minHeight: '297mm',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)' // Shadow for preview, won't be in PDF
        }}
    >
      <PersonalInfoDisplay info={personalInfo} theme={theme} />

      {summary && (
        <>
          <SectionTitle title="Summary" />
          <p className={`text-sm text-gray-600 leading-relaxed mb-4`}>{summary}</p>
        </>
      )}

      {experience && experience.length > 0 && (
        <>
          <SectionTitle title="Experience" />
          {experience.map(exp => <ExperienceItemDisplay key={exp.id} exp={exp} theme={theme} />)}
        </>
      )}

      {education && education.length > 0 && (
        <>
          <SectionTitle title="Education" />
          {education.map(edu => <EducationItemDisplay key={edu.id} edu={edu} theme={theme} />)}
        </>
      )}

      {skills && skills.length > 0 && (
         <SkillsSectionDisplay skills={skills} theme={theme} />
      )}
    </div>
  );
};

export default MinimalistTemplate;
