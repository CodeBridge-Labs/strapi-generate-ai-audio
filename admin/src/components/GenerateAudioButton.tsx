import { Button, Box, Typography, Loader, Status } from "@strapi/design-system";
import React, { useEffect, useState } from "react";
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

interface GenerateAudioButtonProps {
  name: string;
  error?: string;
  description?: string;
  onChange: any;
  value: any;
  intlLabel?: string;
  attribute?: any;
}

export default function GenerateAudioButton({
  name,
  error,
  description,
  onChange,
  value,
  intlLabel,
  attribute,
}: GenerateAudioButtonProps) {
  const [jwtToken, setJwtToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  
  const { modifiedData, slug, initialData } = useCMEditViewDataManager();

  useEffect(() => {
    const sessionToken = sessionStorage.getItem("jwtToken");
    if (sessionToken) {
      const token = sessionToken.slice(1, sessionToken.length - 1);
      if (token) {
        setJwtToken(token);
      }
    }
  }, []);

  const getContentType = (): string => {
    if (slug.includes('blog')) return 'api::blog.blog';
    if (slug.includes('devotional')) return 'api::devotional.devotional';
    return slug;
  };

  const hasContent = (): boolean => {
    if (slug.includes('blog')) {
      return !!(modifiedData.content && modifiedData.content.trim());
    }
    if (slug.includes('devotional')) {
      return !!(
        modifiedData.content || 
        modifiedData.bible_verse || 
        modifiedData.prayer || 
        modifiedData.action
      );
    }
    return false;
  };

  const handleGenerateAudio = async () => {
    if (!initialData.id) {
      setStatus('error');
      setMessage('Please save the content first before generating audio.');
      return;
    }

    if (!hasContent()) {
      setStatus('error');
      setMessage('No content available to generate audio from.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch(`/generate-ai-audio/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          contentType: getContentType(),
          entityId: initialData.id,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to generate audio');
      }

      const result = await response.json();
      
      setStatus('success');
      setMessage(`Audio generated successfully! (${result.characterCount} characters, ${result.chunksProcessed} chunk(s)). Reloading...`);
      
      onChange({ 
        target: { 
          name, 
          value: result.audioFile?.id?.toString() || 'generated', 
          type: attribute?.type 
        } 
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error('Error generating audio:', err);
      setStatus('error');
      setMessage(err.message || 'An error occurred while generating audio');
    } finally {
      setLoading(false);
    }
  };

  const hasExistingAudio = !!(initialData.narration_audio);

  return (
    <Box padding={4} background="neutral100" borderRadius="4px">
      <Box paddingBottom={2}>
        <Typography variant="pi" fontWeight="bold">
          AI Audio Narration
        </Typography>
      </Box>
      
      <Box paddingBottom={3}>
        <Typography variant="pi" textColor="neutral600">
          Generate an audio narration of this content.
          {hasExistingAudio && ' This will replace the existing audio.'}
        </Typography>
      </Box>

      {!initialData.id && (
        <Box paddingBottom={3}>
          <Status variant="secondary" size="S" showBullet={false}>
            <Typography variant="pi">Save the content first to enable audio generation.</Typography>
          </Status>
        </Box>
      )}

      {status === 'success' && (
        <Box paddingBottom={3}>
          <Status variant="success" size="S" showBullet={false}>
            <Typography variant="pi">{message}</Typography>
          </Status>
        </Box>
      )}

      {status === 'error' && (
        <Box paddingBottom={3}>
          <Status variant="danger" size="S" showBullet={false}>
            <Typography variant="pi">{message}</Typography>
          </Status>
        </Box>
      )}

      <Button
        onClick={handleGenerateAudio}
        loading={loading}
        disabled={loading || !initialData.id}
        variant={hasExistingAudio ? "secondary" : "default"}
        startIcon={loading ? <Loader small /> : null}
      >
        {loading 
          ? 'Generating audio...' 
          : hasExistingAudio 
            ? 'Regenerate Audio' 
            : 'Generate Audio'
        }
      </Button>

      {loading && (
        <Box paddingTop={2}>
          <Typography variant="pi" textColor="neutral600">
            This may take a moment depending on content length...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
