const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require("cors")
require("dotenv").config()

const app = express();

app.use(bodyParser.json());
app.use(cors())

const GITHUB_USERNAME = process.env.USER_NAME;

// Middleware to set GitHub API headers
const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        'Authorization': `Bearer ${process.env.GITHUB_PRIVATE_TOKEN}`,
        'Accept': 'application/vnd.github+json'
    }
});

app.get("/",(req,res)=>{
    res.send("Home route")
})

// GET /github → Show GitHub data (followers, following, repositories)
app.get('/github', async (req, res) => {
    try {
        const [userRes, reposRes] = await Promise.all([
            githubApi.get(`/users/${GITHUB_USERNAME}`),
            githubApi.get(`/users/${GITHUB_USERNAME}/repos`)
        ]);

        const userData = {
            username: userRes.data.login,
            followers: userRes.data.followers,
            following: userRes.data.following,
            public_repos: userRes.data.public_repos,
            repos: reposRes.data.map(repo => ({
                name: repo.name,
                url: repo.html_url,
                description: repo.description
            }))
        };

        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch GitHub data' });
    }
});

// GET /github/{repo-name} → Show data about a particular project
app.get('/github/:repoName', async (req, res) => {
    const { repoName } = req.params;

    try {
        const repoRes = await githubApi.get(`/repos/${GITHUB_USERNAME}/${repoName}`);
        res.status(200).json({
            name: repoRes.data.name,
            description: repoRes.data.description,
            url: repoRes.data.html_url,
            stars: repoRes.data.stargazers_count,
            forks: repoRes.data.forks_count,
            open_issues: repoRes.data.open_issues_count
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch repository data' });
    }
});

// POST /github/{repo-name}/issues → Create an issue in the repo
app.post('/github/:repoName/issues', async (req, res) => {
    const { repoName } = req.params;
    const { title, body } = req.body;

    try {
        const issueRes = await githubApi.post(`/repos/${GITHUB_USERNAME}/${repoName}/issues`, {
            title,
            body
        });

        res.status(201).json({"Message":`New issue has been created in ${repoName} repo`, url: issueRes.data.html_url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create GitHub issue' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
});
