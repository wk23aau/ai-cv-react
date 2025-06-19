import React from 'react';
import { CVData, ThemeOptions, PersonalInfo, ExperienceEntry, EducationEntry, SkillEntry } from '../../types'; // Adjust path if necessary
// Using Base components from CVPreview and customizing them through props or specific components here
import {
    PersonalInfoSection as BasePersonalInfoSection,
    SummarySection as BaseSummarySection,
    ExperienceItem as BaseExperienceItem,
    EducationItem as BaseEducationItem,
    SkillsSectionItem as BaseSkillsSectionItem,
    SectionTitle as BaseSectionTitle,
    getShortLinkText
} from '../CVPreview'; // Adjust path to CVPreview.tsx

// Academic specific SectionTitle
const SectionTitle: React.FC<{ title: string; primaryColor: string }> = ({ title, primaryColor }) => (
  <h2 className={`text-xl font-sans font-semibold border-b-2 ${primaryColor ? `border-${primaryColor}` : 'border-gray-700'} ${primaryColor ? `text-${primaryColor}` : 'text-gray-700'} mt-5 mb-3 pb-1 uppercase tracking-wider`}>
    {title}
  </h2>
);

const AcademicPersonalInfo: React.FC<{ info: PersonalInfo; theme: ThemeOptions }> = ({ info, theme }) => {
  const contactLinks = [
    info.showEmail && info.email ? { label: info.email, href: `mailto:${info.email}` } : null,
    info.showLinkedin && info.linkedin ? { label: getShortLinkText(info.linkedin, 'linkedin'), href: info.linkedin.startsWith('http') ? info.linkedin : `https://${info.linkedin}` } : null,
    info.showGithub && info.github ? { label: getShortLinkText(info.github, 'github'), href: info.github.startsWith('http') ? info.github : `https://${info.github}` } : null,
    info.showPortfolio && info.portfolio ? { label: getShortLinkText(info.portfolio, 'portfolio'), href: info.portfolio.startsWith('http') ? info.portfolio : `https://${info.portfolio}` } : null,
  ].filter(Boolean);

  return (
    <div className="text-center mb-6 pb-4 border-b border-gray-300">
      <h1 className={`text-4xl font-sans font-bold ${theme.primaryColor ? `text-${theme.primaryColor}` : 'text-gray-800'}`}>{info.name}</h1>
      <p className="text-lg font-sans text-gray-700 mt-1">{info.title}</p>

      <div className="mt-2 text-sm text-gray-600 flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
        {info.showPhone && info.phone && <span>{info.phone}</span>}
        {contactLinks.map(link => (
          <a key={link!.href} href={link!.href} target="_blank" rel="noopener noreferrer" className={`hover:text-${theme.primaryColor || 'gray-800'}`}>{link!.label}</a>
        ))}
      </div>
      {info.showAddress && info.address && (
        <p className="text-sm text-gray-500 mt-1">{info.address}</p>
      )}
    </div>
  );
};


const AcademicExperienceItem: React.FC<{ exp: ExperienceEntry; theme: ThemeOptions }> = ({ exp, theme }) => (
  <div className="mb-4">
    <h3 className={`text-lg font-sans font-semibold ${theme.primaryColor ? `text-${theme.primaryColor}`: 'text-gray-700'}`}>{exp.jobTitle}</h3>
    <div className="flex justify-between items-baseline">
      <p className={`text-md font-sans font-medium text-gray-700`}>{exp.company}</p>
      <p className={`text-sm text-gray-500`}>{exp.location}</p>
    </div>
    <p className={`text-sm text-gray-500 mb-1`}>{exp.startDate} - {exp.endDate}</p>
    <ul className={`list-disc list-inside ml-2 text-sm font-serif text-gray-700 space-y-1`}>
      {exp.responsibilities.filter(r => r.trim() !== "").map((resp, index) => <li key={index}>{resp}</li>)}
    </ul>
  </div>
);

const AcademicEducationItem: React.FC<{ edu: EducationEntry; theme: ThemeOptions }> = ({ edu, theme }) => (
  <div className="mb-4"> {/* Increased bottom margin for education items */}
    <h3 className={`text-lg font-sans font-semibold ${theme.primaryColor ? `text-${theme.primaryColor}`: 'text-gray-700'}`}>{edu.degree}</h3>
    <div className="flex justify-between items-baseline">
      <p className={`text-md font-sans font-medium text-gray-700`}>{edu.institution}</p>
      <p className={`text-sm text-gray-500`}>{edu.location}</p>
    </div>
    <p className={`text-sm text-gray-500 mb-1`}>{edu.graduationDate}</p>
    {edu.details && edu.details.filter(d => d.trim() !== "").length > 0 && (
      <ul className={`list-disc list-inside ml-2 text-sm font-serif text-gray-700 space-y-1`}>
        {edu.details.filter(d => d.trim() !== "").map((detail, index) => <li key={index}>{detail}</li>)}
      </ul>
    )}
  </div>
);

const AcademicSkillsSection: React.FC<{ skills: SkillEntry[]; theme: ThemeOptions }> = ({ skills, theme }) => {
  if (skills.length === 0) return null;
  return (
    <div>
      <SectionTitle title="Skills" primaryColor={theme.primaryColor} />
      {skills.map((skillItem) => (
        skillItem.skills.filter(s => s.trim() !== "").length > 0 && (
          <div key={skillItem.id || skillItem.category} className="mb-2">
            <span className={`text-sm font-sans font-semibold text-gray-700`}>{skillItem.category}: </span>
            <span className={`text-sm font-serif text-gray-600`}>{skillItem.skills.filter(s => s.trim() !== "").join(', ')}</span>
          </div>
        )
      ))}
    </div>
  );
};


interface AcademicTemplateProps {
  cvData: CVData;
  theme: ThemeOptions;
}

const AcademicTemplate: React.FC<AcademicTemplateProps> = ({ cvData, theme }) => {
  const { personalInfo, summary, experience, education, skills } = cvData;
  // Default to font-serif for body if not specified, or if specified use it.
  // Headings will be font-sans as per individual component styling.
  const bodyFont = theme.fontFamily === 'font-serif' ? 'font-serif' : 'font-serif'; // Explicitly serif for academic
  const headingFont = 'font-sans'; // Explicitly sans-serif for headings

  // Use theme.backgroundColor or default to a light off-white for academic
  const bgColor = theme.backgroundColor === 'white' ? 'bg-gray-50' : `bg-${theme.backgroundColor}`;


  return (
    <div
      id="cv-content-formatted"
      className={`p-10 ${bgColor} text-gray-800 ${bodyFont} max-w-4xl mx-auto`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      <AcademicPersonalInfo info={personalInfo} theme={theme} />

      {summary && (
        <>
          <SectionTitle title="Summary" primaryColor={theme.primaryColor} />
          <p className={`text-sm font-serif text-gray-700 leading-relaxed mb-4`}>{summary}</p>
        </>
      )}

      {/* Consider if "Publications" or "Research" should be a distinct section.
          For now, users can add these under "Experience" with an appropriate jobTitle. */}

      {education && education.length > 0 && (
        <>
          <SectionTitle title="Education" primaryColor={theme.primaryColor} />
          {education.map(edu => <AcademicEducationItem key={edu.id} edu={edu} theme={theme} />)}
        </>
      )}

      {experience && experience.length > 0 && (
        <>
          <SectionTitle title="Experience" primaryColor={theme.primaryColor} />
          {experience.map(exp => <AcademicExperienceItem key={exp.id} exp={exp} theme={theme} />)}
        </>
      )}

      {skills && skills.length > 0 && (
        <AcademicSkillsSection skills={skills} theme={theme} />
      )}
    </div>
  );
};

export default AcademicTemplate;
