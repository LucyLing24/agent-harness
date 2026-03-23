/**
 * Send a plain text message via Discord webhook.
 */
export async function sendDiscordMessage(
  webhookUrl: string,
  content: string
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return response.ok;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}

/**
 * Send a rich embed via Discord webhook.
 */
export async function sendDiscordEmbed(
  webhookUrl: string,
  embed: {
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp?: string;
  }
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return response.ok;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}
