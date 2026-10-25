export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = 'data.json';

  try {
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const fileData = await getFileResponse.json();
    const sha = fileData.sha;
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const currentList = JSON.parse(content || '[]');

    currentList.push(req.body);

    const updatedContent = Buffer.from(JSON.stringify(currentList, null, 2)).toString('base64');

    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: 'Add new submission data',
          content: updatedContent,
          sha: sha,
        }),
      }
    );

    if (updateResponse.ok) {
      return res.status(200).json({ success: true, message: 'Data saved to GitHub!' });
    } else {
      throw new Error('Failed to update file on GitHub');
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
