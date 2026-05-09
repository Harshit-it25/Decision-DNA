const fs = require('fs');
const path = require('path');
const https = require('https');

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node scripts/upload_to_github_v2.cjs <TOKEN> <OWNER> <REPO_NAME>');
    process.exit(1);
}

const TOKEN = args[0];
const OWNER = args[1];
const REPO = args[2];

const IGNORE_DIRS = ['node_modules', '.git', '.github', '.venv', 'venv', 'env', 'ENV', '__pycache__', 'dist', 'build'];
const IGNORE_FILES = ['.DS_Store', 'Thumbs.db', '.env', 'scratch_upload.cjs', 'final_upload.cjs', 'scratch_upload.js', 'model_upload.cjs'];

async function request(method, urlPath, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path: urlPath,
            method: method,
            headers: {
                'Authorization': `token ${TOKEN}`,
                'User-Agent': 'Antigravity-GitHub-Uploader-V2',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(body ? JSON.parse(body) : {});
                } else {
                    reject(new Error(`API Error: ${res.statusCode} - ${body}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

function getAllFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relPath = path.relative(process.cwd(), fullPath);
        
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                getAllFiles(fullPath, allFiles);
            }
        } else {
            if (!IGNORE_FILES.includes(file)) {
                // Skip files larger than 25MB (GitHub REST API limit)
                const MAX_SIZE = 25 * 1024 * 1024;
                if (stats.size > MAX_SIZE) {
                    console.log(`⚠️ Skipping ${relPath} (too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                    continue;
                }
                allFiles.push(relPath);
            }
        }
    }
    return allFiles;
}

async function main() {
    try {
        const files = getAllFiles('.');
        console.log(`Found ${files.length} files to upload.`);

        for (const file of files) {
            const gitPath = file.replace(/\\/g, '/');
            process.stdout.write(`Updating ${gitPath}... `);
            
            const content = fs.readFileSync(file).toString('base64');
            
            // Get SHA if exists
            let sha = null;
            try {
                const existing = await request('GET', `/repos/${OWNER}/${REPO}/contents/${gitPath}`);
                sha = existing.sha;
            } catch (e) {
                // New file
            }

            await request('PUT', `/repos/${OWNER}/${REPO}/contents/${gitPath}`, {
                message: `Update ${gitPath} via Antigravity`,
                content: content,
                sha: sha
            });
            console.log('Done.');
        }

        console.log('\nSuccess! All files have been updated in the repository.');
        console.log(`URL: https://github.com/${OWNER}/${REPO}`);

    } catch (error) {
        console.error('\nError during upload:', error.message);
        process.exit(1);
    }
}

main();
