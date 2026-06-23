import { useEffect, useState } from 'react';
import { apiGet, type PageContent } from './client';

export type PageContentStatus = 'loading' | 'ready' | 'error';

const emptyPageContent: PageContent = {
  home_highlights: [],
  workflows: [],
  tool_combinations: [],
  prompt_groups: [],
  command_groups: [],
  guide_choices: [],
  guide_workflow_tips: [],
  guide_safety_notes: [],
};

export function usePageContent() {
  const [pageContent, setPageContent] = useState<PageContent>(emptyPageContent);
  const [status, setStatus] = useState<PageContentStatus>('loading');

  useEffect(() => {
    let isMounted = true;

    apiGet<PageContent>('/api/page-content')
      .then((content) => {
        if (!isMounted) return;
        setPageContent(content);
        setStatus('ready');
      })
      .catch(() => {
        if (!isMounted) return;
        setPageContent(emptyPageContent);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { pageContent, status };
}
