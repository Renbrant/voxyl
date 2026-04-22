import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all episode progress records where episode was mostly played
    const allProgress = await base44.entities.EpisodeProgress.list('-updated_date', 10000);

    // Count by podcast (group by domain/pattern from audio_url)
    const podcastMap = {};

    allProgress.forEach(progress => {
      // Count if marked as finished OR played 70%+
      const isMarkedFinished = progress.finished;
      const isPlayed70Plus = progress.duration_seconds > 0 && 
        (progress.position_seconds / progress.duration_seconds) >= 0.7;

      if (!isMarkedFinished && !isPlayed70Plus) return;

      // Extract podcast identifier from audio URL
      // Most podcast URLs have a common pattern - we'll use the domain
      const url = progress.audio_url || '';
      try {
        const urlObj = new URL(url);
        const host = urlObj.hostname;
        
        if (!podcastMap[host]) {
          podcastMap[host] = {
            id: host,
            playCount: 0,
            sampleUrl: url
          };
        }
        podcastMap[host].playCount++;
      } catch {
        // Skip invalid URLs
      }
    });

    // Sort by play count and return top 100
    const sorted = Object.values(podcastMap)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 100);

    return Response.json({ podcasts: sorted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});