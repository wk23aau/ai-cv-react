// Placeholder for actual auth token retrieval logic
// In a real app, this would come from AuthContext or localStorage after login
const getAuthToken = (): string | null => {
  // Example: return localStorage.getItem('userToken');
  // For now, returning null or a dummy token for structure compilation.
  // This needs to be replaced with actual token logic for APIs to work.
  console.warn("getAuthToken: Using placeholder. Replace with actual token retrieval.");
  return "dummy-jwt-token"; // Replace this!
};

import React, { useState, useCallback, useEffect, startTransition } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { trackEvent } from '../services/analyticsService';
import { CVData, ThemeOptions, GeminiRequestStatus, AutofillTarget, ExperienceEntry, CVSection, SkillEntry, EducationEntry, TailoredCVUpdate, SectionContentType as SectionGenType } from '../types'; // Renamed SectionContentType to avoid conflict
import { INITIAL_CV_DATA, DEFAULT_THEME, PaletteIcon, DocumentTextIcon, DownloadIcon, SparklesIcon, WandSparklesIcon } from '../constants';
import CVPreview from '../../components/CVPreview';
import ThemeSelectorPanel from '../../components/panels/ThemeSelectorPanel';
import ContentEditorPanel from '../../components/panels/ContentEditorPanel';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import { generateCVContent } from '../../services/geminiService';

declare var html2pdf: any;

type ActivePanel = 'theme' | 'content';
// type InitialInputType = 'title' | 'description'; // Removed as InitialCVGenerator is removed

const EditorPage: React.FC = () => {
  const location = useLocation();
  const { cvId } = useParams<{ cvId: string }>();
  const navigate = useNavigate();
  const [cvData, setCVData] = useState<CVData>(INITIAL_CV_DATA);
  const [currentTheme, setCurrentTheme] = useState<ThemeOptions>(DEFAULT_THEME);
  const [activePanel, setActivePanel] = useState<ActivePanel>('content');
  const [geminiStatus, setGeminiStatus] = useState<GeminiRequestStatus>(GeminiRequestStatus.IDLE);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  // const [isAppLoading, setIsAppLoading] = useState<boolean>(true); // Removed
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [jobDescriptionForTailoring, setJobDescriptionForTailoring] = useState<string>('');
  const [activeGeminiAction, setActiveGeminiAction] = useState<string | null>(null); // e.g. 'initial_cv_title', 'initial_cv_jd', 'tailor_cv'
  const [applyDetailedExperienceUpdates, setApplyDetailedExperienceUpdates] = useState<boolean>(true);
  const [currentCvId, setCurrentCvId] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState<boolean>(false); // New state
  const [currentTemplateId, setCurrentTemplateId] = useState<string | number | null>('classic'); // Default to classic


  useEffect(() => {
    try {
      const savedCVData = localStorage.getItem('geminiCVData');
      const savedTheme = localStorage.getItem('geminiCVTheme');
      const savedJobDescription = localStorage.getItem('geminiJobDescription');
      const savedApplyDetailedUpdates = localStorage.getItem('geminiApplyDetailedUpdates');


      if (savedCVData) setCVData(JSON.parse(savedCVData));
      if (savedTheme) setCurrentTheme(JSON.parse(savedTheme));
      // if (initialCvFlag) setIsInitialCvGenerated(JSON.parse(initialCvFlag)); // Removed
      if (savedJobDescription) setJobDescriptionForTailoring(savedJobDescription);
      if (savedApplyDetailedUpdates) setApplyDetailedExperienceUpdates(JSON.parse(savedApplyDetailedUpdates));

    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setCVData(prev => (Object.keys(prev).length === 0 ? INITIAL_CV_DATA : prev));
      setCurrentTheme(prev => (Object.keys(prev).length === 0 ? DEFAULT_THEME : prev));
      // setIsInitialCvGenerated(false); // Removed
      setJobDescriptionForTailoring('');
      setApplyDetailedExperienceUpdates(true);
    }
    // setIsAppLoading(false); // Removed
  }, []);

  useEffect(() => {
    // if(!isAppLoading) { // Condition removed
        // localStorage.setItem('geminiCVData', JSON.stringify(cvData)); // Backend now handles persistence
    // }
  }, [cvData]); // isAppLoading removed from dependency array

  useEffect(() => {
    // if(!isAppLoading) { // Condition removed
        // localStorage.setItem('geminiCVTheme', JSON.stringify(currentTheme)); // Theme might be linked to CV or template in backend
    // }
  }, [currentTheme]); // isAppLoading removed from dependency array

  useEffect(() => {
    // if (!isAppLoading) { // Condition removed
        localStorage.setItem('geminiJobDescription', jobDescriptionForTailoring);
    // }
  }, [jobDescriptionForTailoring]); // isAppLoading removed from dependency array

  useEffect(() => {
    // if (!isAppLoading) { // Condition removed
        localStorage.setItem('geminiApplyDetailedUpdates', JSON.stringify(applyDetailedExperienceUpdates));
    // }
  }, [applyDetailedExperienceUpdates]); // isAppLoading removed from dependency array


  const handleCVDataChange = useCallback((newData: CVData) => {
    setCVData(newData);
  }, []);

  const handleThemeChange = useCallback((theme: ThemeOptions) => {
    setCurrentTheme(theme);
  }, []);

  const handleThemeOptionChange = useCallback(<K extends keyof ThemeOptions>(option: K, value: ThemeOptions[K]) => {
    setCurrentTheme(prevTheme => ({ ...prevTheme, [option]: value }));
  }, []);

  const clearGeminiError = useCallback(() => {
    setGeminiError(null);
  }, []);

  const handleInitialCvGeneration = async (inputValue: string, inputType: InitialInputType, templateId?: string | number | null) => { // Added templateId parameter
    const actionType = inputType === 'title' ? 'initial_cv_title' : 'initial_cv_jd';
    setActiveGeminiAction(actionType);
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    try {
        const generationMode = inputType === 'title' ? 'initial_cv_from_title' : 'initial_cv_from_job_description';
        const result = await generateCVContent(generationMode as SectionGenType, inputValue);
        startTransition(() => {
            setCVData(result as CVData);
            // --- BEGIN Backend Save Logic for New CV ---
            const token = getAuthToken();
            if (token) {
              fetch('/api/cvs', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                // Ensure cv_data is what the backend expects (the 'result' object)
                body: JSON.stringify({ cv_data: result, template_id: templateId || currentTemplateId || 'classic', name: (result as CVData).personalInfo.name || 'Untitled CV' }),
              })
              .then(response => {
                if (!response.ok) {
                  // Try to parse error message from backend if available
                  return response.json().then(err => { throw new Error(err.message || `Failed to save (HTTP ${response.status})`); });
                }
                return response.json();
              })
              .then(savedCv => {
                console.log('New CV saved to backend:', savedCv);
                if (savedCv && savedCv.id) {
                    setCurrentCvId(savedCv.id);
                    // If CV is saved to backend, we might not need to store it in localStorage under 'geminiCVData'
                    // localStorage.removeItem('geminiCVData'); // Or update it with the ID for consistency
                }
              })
              .catch(saveError => {
                console.error('Error saving new CV to backend:', saveError);
                setGeminiError(`CV generated locally but failed to save to server: ${saveError instanceof Error ? saveError.message : String(saveError)}. It is still available in this session.`);
                // If save fails, cvData is still in state, and localStorage saving (if active) will preserve it.
              });
            } else {
              console.warn("No auth token, new CV not saved to backend. Will rely on localStorage if configured.");
              // If localStorage is the fallback, ensure it saves here or by its dedicated useEffect
            }
            // --- END Backend Save Logic for New CV ---
            setIsEditorReady(true); // Mark editor as ready
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            setActiveGeminiAction(null);
        });
    } catch (err) {
        console.error("Initial CV generation error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to generate initial CV.";
        setGeminiError(errorMessage);
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
    }
  };

  const handleAutofillRequest = useCallback(async (target: AutofillTarget, promptValue: string, context?: any) => {
    const fieldKey = context?.generationType === 'new_experience_entry'
        ? `new_experience_entry_${cvData.experience.length}`
        : target.field
            ? `${target.section}-${target.index}-${target.field}`
            : (target.section as string);

    setActiveGeminiAction(fieldKey);
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);

    const generationType = (context?.generationType as SectionGenType) || null;

    if (!generationType) {
        const errMsg = `Unsupported autofill target or generation type mapping. Target: ${JSON.stringify(target)}`;
        console.error(errMsg);
        setGeminiError(errMsg);
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
        return;
    }

    try {
      const result = await generateCVContent(generationType, promptValue, context);

      startTransition(() => {
        setCVData(prevCvData => {
          const newCvData = JSON.parse(JSON.stringify(prevCvData));

          if (generationType === 'new_experience_entry' && target.section === 'experience' && target.action === 'add_new_gemini') {
              const newEntry = result as ExperienceEntry;
              newCvData.experience.push({ ...newEntry, id: newEntry.id || crypto.randomUUID() });
          } else if (generationType === 'new_education_entry' && target.section === 'education' && target.action === 'add_new_gemini') {
              const newEntry = result as EducationEntry;
              newCvData.education.push({ ...newEntry, id: newEntry.id || crypto.randomUUID() });
          } else if (target.section === 'summary' && typeof result === 'string') {
            newCvData.summary = result;
          } else if (target.section.startsWith('experience.') && target.field === 'responsibilities' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.experience[target.index]) {
              newCvData.experience[target.index].responsibilities = result as string[];
            }
          } else if (target.section.startsWith('education.') && target.field === 'details' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.education[target.index]) {
              newCvData.education[target.index].details = result as string[];
            }
          } else if (target.section.startsWith('skills.') && target.field === 'skills' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.skills[target.index]) {
              newCvData.skills[target.index].skills = result as string[];
            }
          }
          return newCvData;
        });
        setGeminiStatus(GeminiRequestStatus.SUCCESS);
        setActiveGeminiAction(null);
      });
    } catch (err) {
      console.error("Gemini autofill error:", err);
      setGeminiError(err instanceof Error ? err.message : "An unknown error occurred during content generation.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      setActiveGeminiAction(null);
    }
  }, [cvData.experience.length]);

  const handleTailorCvRequest = useCallback(async (jobDescription: string, currentCvData: CVData, applyDetailedUpdates: boolean) => {
    setActiveGeminiAction('tailor_cv');
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    try {
        const result = await generateCVContent(
            'tailor_cv_to_job_description',
            jobDescription,
            {
                existingCV: currentCvData,
                applyDetailedExperienceUpdates: applyDetailedUpdates
            }
        ) as TailoredCVUpdate;

        startTransition(() => {
            setCVData(prevCvData => {
                const newCvData = JSON.parse(JSON.stringify(prevCvData));
                newCvData.summary = result.updatedSummary;
                newCvData.skills = result.updatedSkills.map(updatedSkill => {
                    const existingSkill = prevCvData.skills.find(s => s.id === updatedSkill.id || s.category === updatedSkill.category);
                    return { ...updatedSkill, id: updatedSkill.id || existingSkill?.id || crypto.randomUUID() };
                });
                result.updatedExperience.forEach(updatedExp => {
                    const expIndex = newCvData.experience.findIndex((exp: ExperienceEntry) => exp.id === updatedExp.id);
                    if (expIndex !== -1) {
                        newCvData.experience[expIndex].responsibilities = updatedExp.responsibilities;
                        if (applyDetailedUpdates && updatedExp.updatedJobTitle && typeof updatedExp.updatedJobTitle === 'string' && updatedExp.updatedJobTitle.trim() !== "") {
                            newCvData.experience[expIndex].jobTitle = updatedExp.updatedJobTitle;
                        }
                    }
                });
                if (applyDetailedUpdates && result.suggestedNewExperienceEntries && result.suggestedNewExperienceEntries.length > 0) {
                    const newEntriesWithIds = result.suggestedNewExperienceEntries.map(entry => ({ ...entry, id: crypto.randomUUID() }));
                    newCvData.experience.push(...newEntriesWithIds);
                }
                return newCvData;
            });
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            setActiveGeminiAction(null);
        });
    } catch (err) {
        console.error("CV Tailoring error:", err);
        setGeminiError(err instanceof Error ? err.message : "Failed to tailor CV.");
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
    }
  }, []);

  const handleSaveCv = async () => {
    if (!currentCvId) {
      // This case should ideally trigger a "Save As" or initial save if CV is new but not yet saved.
      // For now, if no currentCvId, it implies it's a new CV not yet processed by handleInitialCvGeneration's save.
      // Or, it could be a CV that was never saved and user hit a generic "Save" button.
      // A robust solution would be to call something like handleInitialCvGeneration's save portion.
      // For simplicity here: if no ID, try to save as new.
      console.log("Save clicked, but no currentCvId. Trying to save as new.");
      // We need the "generation mode" if we call handleInitialCvGeneration. This is tricky.
      // Alternative: Directly call the POST logic if cvData is populated.
      const token = getAuthToken();
      if (token && cvData && cvData.personalInfo.name) { // Ensure cvData is populated
        setGeminiStatus(GeminiRequestStatus.LOADING);
        setActiveGeminiAction('saving_cv'); // Indicate save operation is in progress
        try {
            const response = await fetch('/api/cvs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ cv_data: cvData, template_id: currentTemplateId || 'classic', name: cvData.personalInfo.name || 'Untitled CV' })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || `Failed to save new CV (HTTP ${response.status})`);
            }
            const savedCv = await response.json();
            setCurrentCvId(savedCv.id);
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            console.log("CV saved as new with ID:", savedCv.id);
            setActiveGeminiAction('save_cv_success');
            setTimeout(() => setActiveGeminiAction(null), 3000);
        } catch (error) {
            console.error("Error saving new CV via Save button:", error);
            setGeminiError(error instanceof Error ? error.message : "Failed to save CV.");
            setGeminiStatus(GeminiRequestStatus.ERROR);
            setActiveGeminiAction(null); // Clear saving action on error
        }
      } else if (!token) {
        setGeminiError("Cannot save CV: Not authenticated.");
      } else {
        setGeminiError("Cannot save CV: CV data is incomplete.");
      }
      return;
    }

    // If currentCvId exists, update existing CV
    const token = getAuthToken();
    if (!token) {
      setGeminiError("Authentication required to save CV.");
      // navigate('/login');
      return;
    }

    setGeminiStatus(GeminiRequestStatus.LOADING);
    setActiveGeminiAction('saving_cv'); // Indicate save operation is in progress
    try {
      const response = await fetch(`/api/cvs/${currentCvId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cv_data: cvData, template_id: currentTemplateId || 'classic', name: cvData.personalInfo.name }), // Adjust payload as needed
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to update CV (HTTP ${response.status})`);
      }

      const updatedCv = await response.json(); // Get updated CV (might include new updated_at)
      startTransition(() => {
        // Optionally update cvData if backend modifies it (e.g. updated_at)
        // setCVData(updatedCv.cv_data);
        setGeminiStatus(GeminiRequestStatus.SUCCESS);
         console.log("CV updated successfully:", updatedCv);
        setActiveGeminiAction('save_cv_success');
        setTimeout(() => setActiveGeminiAction(null), 3000); // Clear message
        // Add user feedback (e.g., a toast message "CV Saved!")
      });

    } catch (err) {
      console.error("Error updating CV:", err);
      setGeminiError(err instanceof Error ? err.message : "Failed to save CV updates.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      setActiveGeminiAction(null); // Clear saving action on error
    }
  };

  const handleDownloadPDF = useCallback(() => {
    const scaleBeforePdf = currentTheme.previewScale || 1;
    startTransition(() => {
        setIsPdfGenerating(true);
        setCurrentTheme(prev => ({ ...prev, previewScale: 1 }));
    });
    setGeminiError(null);
    setTimeout(() => {
        const element = document.getElementById('cv-content-formatted');
        if (element) {
            trackEvent('download_cv_pdf', { event_category: 'CV Action', event_label: 'PDF Download' });
            const pdfFilename = `CV_${cvData.personalInfo.name.replace(/\s+/g, '_') || 'Resume'}.pdf`;
            const options = { margin: 0, filename: pdfFilename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: currentTheme.backgroundColor === 'white' ? '#FFFFFF' : (tailwindColorToHex(currentTheme.backgroundColor) || '#FFFFFF') }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
            html2pdf().from(element).set(options).save().catch((err: Error) => {
                console.error("PDF generation failed:", err);
                setGeminiError(`Failed to generate PDF: ${err.message}`);
            }).finally(() => {
                startTransition(() => {
                    setCurrentTheme(prev => ({ ...prev, previewScale: scaleBeforePdf }));
                    setIsPdfGenerating(false);
                });
            });
        } else {
            console.error("CV content element not found for PDF generation.");
            setGeminiError("Could not find CV content to generate PDF.");
            startTransition(() => {
                setCurrentTheme(prev => ({ ...prev, previewScale: scaleBeforePdf }));
                setIsPdfGenerating(false);
            });
        }
    }, 250);
  }, [currentTheme.previewScale, cvData.personalInfo.name, currentTheme.backgroundColor]);

  const tailwindColorToHex = (twColor: string): string | null => {
    if (twColor.startsWith('gray-')) return '#F9FAFB';
    if (twColor === 'white') return '#FFFFFF';
    if (twColor === 'black') return '#000000';
    const colorMap: {[key:string]: string} = { 'slate-50': '#F8FAFC', 'slate-100': '#F1F5F9', 'blue-50': '#EFF6FF', 'blue-600': '#2563EB', };
    return colorMap[twColor] || null;
  };

  useEffect(() => {
    const loadCv = async () => {
      const token = getAuthToken(); // Needed for API calls

      if (cvId) { // cvId from useParams
        console.log("EditorPage: Attempting to load CV with id:", cvId);
        if (!token) {
          console.error("No auth token available to load CV.");
          setGeminiError("Authentication required to load CV.");
          // navigate('/login'); // Optionally redirect to login
          return;
        }
        setGeminiStatus(GeminiRequestStatus.LOADING);
        try {
          const response = await fetch(`/api/cvs/${cvId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            if (response.status === 404) throw new Error(`CV with ID ${cvId} not found.`);
            if (response.status === 401) throw new Error(`Unauthorized to fetch CV ${cvId}.`);
            throw new Error(`Failed to fetch CV: ${response.statusText}`);
          }
          const data: CVData & { id: string; template_id?: string | number; name?: string } = await response.json();

          startTransition(() => {
            setCVData(data.cv_data); // Assuming data is the full record, and cv_data is the field with actual CV content
            setCurrentCvId(data.id);
            setCurrentTemplateId(data.template_id || 'classic'); // Set template ID
            // TODO: Potentially load/set theme based on template_id or CV theme settings
            setGeminiStatus(GeminiRequestStatus.IDLE);
            setIsEditorReady(true); // Editor is ready with loaded data
          });
        } catch (err) {
          console.error("Error loading CV:", err);
          setGeminiError(err instanceof Error ? err.message : "Failed to load CV data.");
          setGeminiStatus(GeminiRequestStatus.ERROR);
          // navigate('/'); // Optionally redirect to landing or dashboard
        }
      } else if (location.state && Object.keys(location.state).length > 0) { // Check if location.state has content
        console.log("EditorPage: Initializing with location state:", location.state);
        const { jobTitle, jobDescription, selectedTemplateId } = location.state as any;

        // TODO: Set theme based on selectedTemplateId if applicable
        // if (selectedTemplateId) { /* logic to find and set theme */ }

        if (jobTitle) {
          handleInitialCvGeneration(jobTitle, 'title' as InitialInputType, selectedTemplateId);
        } else if (jobDescription) {
          handleInitialCvGeneration(jobDescription, 'description' as InitialInputType, selectedTemplateId);
        } else {
            // No specific data from landing page, load from local storage or default
            const savedCVData = localStorage.getItem('geminiCVData');
            if (savedCVData) {
                try {
                    setCVData(JSON.parse(savedCVData));
                } catch (e) { console.error("Error parsing saved CV data", e); setCVData(INITIAL_CV_DATA); }
            } else {
                setCVData(INITIAL_CV_DATA);
            }
            setIsEditorReady(true); // Ready with local/default data
        }
        // Clear location state after using it to prevent re-triggering on refresh if not desired
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        // No cvId and no location state, load from localStorage or start fresh.
        console.log("EditorPage: No cvId or location.state. Loading from localStorage or default.");
        const savedCVData = localStorage.getItem('geminiCVData');
        const savedTheme = localStorage.getItem('geminiCVTheme');
        if (savedCVData) {
            try {
                setCVData(JSON.parse(savedCVData));
            } catch (e) { console.error("Error parsing saved CV data", e); setCVData(INITIAL_CV_DATA); }
        } else {
            setCVData(INITIAL_CV_DATA);
        }
        if (savedTheme) {
            try {
                setCurrentTheme(JSON.parse(savedTheme));
            } catch (e) { console.error("Error parsing saved theme", e); setCurrentTheme(DEFAULT_THEME); }
        }
        setIsEditorReady(true); // Ready with local/default data
      }
    };

    loadCv();
  }, [cvId, location.state, navigate]); // location.key could be added if we need to re-trigger on same path nav

  if (!isEditorReady) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
        <LoadingSpinner message={geminiStatus === GeminiRequestStatus.LOADING ? "Loading CV Editor..." : "Initializing..."} />
      </div>
    );
  }

  return (
    <>
    {/* <div className="flex flex-col h-screen font-sans antialiased"> // Original top-level div, might be adjusted by layout component */}
    {/* Header removed, will be provided by AppLayout */}
    // <header className="bg-slate-800 text-white p-4 shadow-md flex justify-between items-center">
    //   <h1 className="text-xl font-semibold">JD2CV</h1>
    //   <button onClick={handleDownloadPDF} disabled={isPdfGenerating || geminiStatus === GeminiRequestStatus.LOADING} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md text-sm flex items-center gap-2 disabled:opacity-50" aria-label="Download CV as PDF">
    //       <DownloadIcon className="w-4 h-4"/>{isPdfGenerating ? 'Generating...' : 'Download PDF'}
    //   </button>
    // </header>
    <div className="flex flex-1 overflow-hidden"> {/* This becomes the top-level div for EditorPage content */}
      <aside className="w-1/3 max-w-md bg-slate-200 p-1 flex flex-col border-r border-slate-300">
            <nav className="flex mb-2 rounded-md bg-slate-300 p-0.5">
                <button onClick={() => setActivePanel('content')} className={`flex-1 p-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activePanel === 'content' ? `bg-white text-blue-600 shadow-sm` : `text-slate-600 hover:bg-slate-100`}`} aria-pressed={activePanel === 'content'}>
                    <DocumentTextIcon className="w-4 h-4"/> Content
                </button>
                <button onClick={() => setActivePanel('theme')} className={`flex-1 p-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activePanel === 'theme' ? `bg-white text-purple-600 shadow-sm` : `text-slate-600 hover:bg-slate-100`}`} aria-pressed={activePanel === 'theme'}>
                    <PaletteIcon className="w-4 h-4"/> Theme
                </button>
            </nav>
          {/* Template Selector */}
          <div className="p-2 mt-1 mb-2 border-t border-b border-slate-300">
            <label htmlFor="templateSelector" className="block text-sm font-medium text-gray-700 mb-1">CV Template</label>
            <select
              id="templateSelector"
              value={currentTemplateId || 'classic'}
              onChange={(e) => { const newTemplateId = e.target.value; setCurrentTemplateId(newTemplateId); trackEvent('select_template_editor', { event_category: 'Template Selection', event_label: `Template ID: ${newTemplateId} (Editor)` }); }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {/* These values should match the template IDs used in CVPreview and backend */}
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              {/* TODO: Fetch these template options dynamically from /api/cv-templates */}
            </select>
          </div>
        {/* Save CV Button */}
        {isEditorReady && (
          <div className="p-2 mt-2">
            <button
              onClick={handleSaveCv}
              disabled={geminiStatus === GeminiRequestStatus.LOADING || (geminiStatus === GeminiRequestStatus.SUCCESS && activeGeminiAction === 'save_cv_success') }
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {/* Add an icon if available, similar to DownloadIcon */}
              {(geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === 'saving_cv') ? 'Saving...' : (geminiStatus === GeminiRequestStatus.SUCCESS && activeGeminiAction === 'save_cv_success' ? 'Saved!' : 'Save CV to Cloud')}
            </button>
            {/* A success message could be shown here based on geminiStatus */}
            {geminiStatus === GeminiRequestStatus.SUCCESS && activeGeminiAction === 'save_cv_success' && (
                <p className="text-green-700 text-xs text-center mt-1">CV Saved!</p>
            )}
          </div>
        )}
            <div className="flex-1 overflow-y-auto pr-1">
                {activePanel === 'content' && ( <ContentEditorPanel cvData={cvData} onCVDataChange={handleCVDataChange} onAutofillRequest={handleAutofillRequest} onTailorCvRequest={handleTailorCvRequest} geminiStatus={geminiStatus} geminiError={geminiError} clearGeminiError={clearGeminiError} jobDescriptionForTailoring={jobDescriptionForTailoring} onJobDescriptionChange={setJobDescriptionForTailoring} activeGeminiAction={activeGeminiAction} setActiveGeminiAction={setActiveGeminiAction} applyDetailedExperienceUpdates={applyDetailedExperienceUpdates} onApplyDetailedExperienceUpdatesChange={setApplyDetailedExperienceUpdates} /> )}
                {activePanel === 'theme' && ( <ThemeSelectorPanel currentTheme={currentTheme} onThemeChange={handleThemeChange} onThemeOptionChange={handleThemeOptionChange} /> )}
            </div>
        </aside>
        <main className="flex-1 bg-slate-50 overflow-auto p-6 flex justify-center items-start">
            <div className="w-full h-full">
                <CVPreview cvData={cvData} theme={currentTheme} templateId={currentTemplateId} />
            </div>
        </main>
      </div>
      {/* Footer removed, will be provided by AppLayout */}
      {/* <footer className="bg-slate-800 text-white text-xs p-3 text-center">
        <p> <strong>Privacy Notice:</strong> To provide and improve our services, JD2CV may share your data with third-party AI tools to generate and optimize your CV. By using JD2CV, you consent to this data processing. We are committed to ensuring our practices are UK and EU friendly. </p>
      </footer> */}
       {(geminiStatus === GeminiRequestStatus.LOADING || isPdfGenerating) && ( <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" aria-live="assertive" role="alertdialog"> <LoadingSpinner message={ isPdfGenerating ? "Generating PDF..." : activeGeminiAction === 'tailor_cv' ? "JD2CV AI is tailoring your CV..." : activeGeminiAction === 'initial_cv_title' || activeGeminiAction === 'initial_cv_jd' ? "JD2CV AI is crafting your initial CV..." : (geminiStatus === GeminiRequestStatus.LOADING ? "JD2CV AI is thinking..." : "Processing...") } size="w-12 h-12" /> </div> )}
      {geminiError && activePanel !== 'content' && ( <div className="fixed bottom-4 right-4 z-50"> <ErrorMessage message={geminiError} onClear={clearGeminiError} /> </div> )}
    {/* // </div> // Corresponding end for original top-level div */}
    </>
  );
};
// Type alias for inputType in handleInitialCvGeneration
type InitialInputType = 'title' | 'description';
export default EditorPage;
