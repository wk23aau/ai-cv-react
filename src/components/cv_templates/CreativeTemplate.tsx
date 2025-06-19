import React from 'react';
import { CVData, ThemeOptions, PersonalInfo, ExperienceEntry, EducationEntry, SkillEntry } from '../../types'; // Adjust path
import { getShortLinkText } from '../CVPreview'; // Adjust path

// Helper for links, as they might be styled differently in this template
const ContactLink: React.FC<{ href: string; text: string; icon?: JSX.Element, className?: string, theme: ThemeOptions }> = ({ href, text, icon, className, theme }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={`flex items-center text-sm hover:text-${theme.primaryColor || 'blue-600'} ${className}`}>
    {icon && <span className="mr-2 w-4 h-4">{icon}</span>}
    {text}
  </a>
);

// Icons (simple placeholders, consider using Heroicons or similar if available in constants.tsx)
const MailIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>;
const PhoneIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>;
const LinkedInIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.076-1.601 2.207v4.248H8.014V8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.337 7.433a1.062 1.062 0 01-1.06-1.06A1.06 1.06 0 015.337 5.313a1.06 1.06 0 010 2.12zM6.67 16.338H3.997V8.59h2.673v7.748zM17.638 0H2.362C1.06 0 0 1.06 0 2.362v15.276C0 18.94 1.06 20 2.362 20h15.276C18.94 20 20 18.94 20 17.638V2.362C20 1.06 18.94 0 17.638 0z" clipRule="evenodd"></path></svg>;
const GithubIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.398.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd"></path></svg>;
const PortfolioIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>;


interface CreativeTemplateProps {
  cvData: CVData;
  theme: ThemeOptions;
}

const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ cvData, theme }) => {
  const { personalInfo, summary, experience, education, skills } = cvData;
  const effectiveFont = theme.fontFamily || 'font-sans';
  // Use theme's primary for sidebar, secondary for accents, or defaults
  const sidebarBg = theme.primaryColor ? `bg-${theme.primaryColor}` : 'bg-gray-700';
  const sidebarText = theme.textColor === 'gray-900' || theme.textColor === 'black' ? 'text-white' : `text-${theme.textColorOpposite || 'gray-100'}`; // Heuristic for contrast

  return (
    <div
      id="cv-content-formatted"
      className={`flex ${effectiveFont} max-w-4xl mx-auto`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}
    >
      {/* Sidebar */}
      <div className={`w-1/3 ${sidebarBg} ${sidebarText} p-8 flex flex-col space-y-8`}>
        {personalInfo.showPortrait && personalInfo.portraitUrl && (
          <img src={personalInfo.portraitUrl} alt={personalInfo.name} className="rounded-full w-32 h-32 object-cover mx-auto border-4 border-white shadow-md" />
        )}
        <div>
          <h2 className="text-xl font-semibold border-b-2 border-opacity-50 border-white pb-1 mb-3">Contact</h2>
          <div className="space-y-2">
            {personalInfo.showPhone && personalInfo.phone && <ContactLink href={`tel:${personalInfo.phone}`} text={personalInfo.phone} icon={<PhoneIcon />} theme={theme} className={sidebarText}/>}
            {personalInfo.showEmail && personalInfo.email && <ContactLink href={`mailto:${personalInfo.email}`} text={personalInfo.email} icon={<MailIcon />} theme={theme} className={sidebarText}/>}
            {personalInfo.showLinkedin && personalInfo.linkedin && <ContactLink href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} text={getShortLinkText(personalInfo.linkedin, 'linkedin')} icon={<LinkedInIcon />} theme={theme} className={sidebarText}/>}
            {personalInfo.showGithub && personalInfo.github && <ContactLink href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} text={getShortLinkText(personalInfo.github, 'github')} icon={<GithubIcon />} theme={theme} className={sidebarText}/>}
            {personalInfo.showPortfolio && personalInfo.portfolio && <ContactLink href={personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : `https://${personalInfo.portfolio}`} text={getShortLinkText(personalInfo.portfolio, 'portfolio')} icon={<PortfolioIcon />} theme={theme} className={sidebarText}/>}
            {personalInfo.showAddress && personalInfo.address && <p className="text-sm mt-1">{personalInfo.address}</p>}
          </div>
        </div>

        {skills && skills.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold border-b-2 border-opacity-50 border-white pb-1 mb-3">Skills</h2>
            <div className="space-y-3">
              {skills.filter(s => s.skills.some(sk => sk.trim() !== "")).map(skillItem => (
                <div key={skillItem.id || skillItem.category}>
                  <h3 className="text-md font-semibold mb-0.5">{skillItem.category}</h3>
                  <p className="text-sm">{skillItem.skills.filter(s => s.trim() !== "").join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`w-2/3 p-8 bg-${theme.backgroundColor || 'white'} text-${theme.textColor || 'gray-800'} overflow-y-auto`}>
        <div className="mb-8 text-left">
          <h1 className={`text-5xl font-bold text-${theme.primaryColor || 'gray-800'}`}>{personalInfo.name}</h1>
          <p className={`text-2xl text-${theme.secondaryColor || 'gray-600'} mt-1`}>{personalInfo.title}</p>
        </div>

        {summary && (
          <section className="mb-6">
            <h2 className={`text-2xl font-bold text-${theme.primaryColor || 'gray-700'} border-b-2 border-${theme.primaryColor || 'gray-300'} pb-1 mb-3`}>Summary</h2>
            <p className="text-sm leading-relaxed">{summary}</p>
          </section>
        )}

        {experience && experience.length > 0 && (
          <section className="mb-6">
            <h2 className={`text-2xl font-bold text-${theme.primaryColor || 'gray-700'} border-b-2 border-${theme.primaryColor || 'gray-300'} pb-1 mb-3`}>Experience</h2>
            {experience.filter(exp => exp.jobTitle.trim() !== "").map(exp => (
              <div key={exp.id} className="mb-4">
                <h3 className={`text-lg font-semibold text-${theme.secondaryColor || 'gray-700'}`}>{exp.jobTitle}</h3>
                <div className="flex justify-between items-baseline">
                  <p className="text-md font-medium">{exp.company}</p>
                  <p className="text-sm text-gray-500">{exp.location}</p>
                </div>
                <p className="text-sm text-gray-500 mb-1">{exp.startDate} - {exp.endDate}</p>
                <ul className="list-disc list-inside ml-1 text-sm space-y-0.5">
                  {exp.responsibilities.filter(r => r.trim() !== "").map((resp, index) => <li key={index}>{resp}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}

        {education && education.length > 0 && (
          <section>
            <h2 className={`text-2xl font-bold text-${theme.primaryColor || 'gray-700'} border-b-2 border-${theme.primaryColor || 'gray-300'} pb-1 mb-3`}>Education</h2>
            {education.filter(edu => edu.degree.trim() !== "").map(edu => (
              <div key={edu.id} className="mb-3">
                <h3 className={`text-lg font-semibold text-${theme.secondaryColor || 'gray-700'}`}>{edu.degree}</h3>
                 <div className="flex justify-between items-baseline">
                    <p className="text-md font-medium">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.location}</p>
                </div>
                <p className="text-sm text-gray-500 mb-1">{edu.graduationDate}</p>
                {edu.details && edu.details.filter(d => d.trim() !== "").length > 0 && (
                  <ul className="list-disc list-inside ml-1 text-sm space-y-0.5">
                    {edu.details.filter(d => d.trim() !== "").map((detail, index) => <li key={index}>{detail}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default CreativeTemplate;
