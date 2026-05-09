/**
 * upload_to_github.js
 * 
 * A zero-dependency script to upload the current project to GitHub.
 * Usage: node scripts/upload_to_github.js <TOKEN> <OWNER> <REPO_NAME> [IS_PRIVATE]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node scripts/upload_to_github.js <TOKEN> <OWNER> <REPO_NAME> [PRIVATE]');
    process.exit(1);
}

const TOKEN = args[0];
const OWNER = args[1];
const REPO = args[2];
const IS_PRIVATE = args[3] === 'true';

const IGNORE_DIRS = ['node_modules', '.git', '.venv', 'venv', 'env', 'ENV', '__pycache__', 'dist', 'build'];
const IGNORE_FILES = ['.DS_Store', 'Thumbs.db', '.env'];

async function request(method, urlPath, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path: urlPath,
            method: method,
            headers: {
                'Authorization': `token ${TOKEN}`,
                'User-Agent': 'Antigravity-GitHub-Uploader',
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
        
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                getAllFiles(fullPath, allFiles);
            }
        } else {
            if (!IGNORE_FILES.includes(file)) {
                allFiles.push(relPath);
            }
        }
    }
    return allFiles;
}

async function main() {
    try {
        console.log(`Checking if repository ${OWNER}/${REPO} exists...`);
        try {
            await request('GET', `/repos/${OWNER}/${REPO}`);
            console.log('Repository already exists.');
        } catch (e) {
            console.log(`Creating repository ${OWNER}/${REPO}...`);
            await request('POST', '/user/repos', {
                name: REPO,
                private: IS_PRIVATE,
                auto_init: false
            });
            console.log('Repository created.');
        }

        const files = getAllFiles('.');
        console.log(`Found ${files.length} files to upload.`);

        // 1. Get the current commit SHA (if exists)
        let baseTreeSha = null;
        try {
            console.log('Retrieving current branch state...');
            const ref = await request('GET', `/repos/${OWNER}/${REPO}/git/refs/heads/main`);
            const commitSha = ref.object.sha;
            console.log(`Current commit SHA: ${commitSha}`);
            const commit = await request('GET', `/repos/${OWNER}/${REPO}/git/commits/${commitSha}`);
            baseTreeSha = commit.tree.sha;
            console.log(`Base tree SHA: ${baseTreeSha}`);
        } catch (e) {
            console.log('Main branch not found or inaccessible, starting fresh.');
        }

        // 2. Create blobs for each file
        const treeItems = [];
        for (const file of files) {
            try {
                process.stdout.write(`Uploading blob for ${file}... `);
                const content = fs.readFileSync(file);
                const blob = await request('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
                    content: content.toString('base64'),
                    encoding: 'base64'
                });
                treeItems.push({
                    path: file.replace(/\\/g, '/'),
                    mode: '100644',
                    type: 'blob',
                    sha: blob.sha
                });
                console.log('Done.');
            } catch (blobError) {
                console.log(`Failed! ${blobError.message}`);
                // Skip files that fail (like very large ones if they exceed limits)
            }
        }

        // 3. Create a new tree
        console.log('Creating new tree...');
        let tree;
        try {
            tree = await request('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
                base_tree: baseTreeSha,
                tree: treeItems
            });
        } catch (treeError) {
            console.log(`Tree creation with base_tree failed: ${treeError.message}. Retrying without base_tree...`);
            tree = await request('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
                tree: treeItems
            });
        }

        // 4. Create a commit
        console.log('Creating commit...');
        const commit = await request('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
            message: 'Initial project upload',
            tree: tree.sha,
            parents: baseTreeSha ? [await request('GET', `/repos/${OWNER}/${REPO}/git/refs/heads/main`).then(r => r.object.sha)] : []
        });

        // 5. Update the ref
        console.log('Updating main branch...');
        if (baseTreeSha) {
            await request('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
                sha: commit.sha,
                force: true
            });
        } else {
            await request('POST', `/repos/${OWNER}/${REPO}/git/refs`, {
                ref: 'refs/heads/main',
                sha: commit.sha
            });
        }

        console.log('Success! Your project has been uploaded to GitHub.');
        console.log(`URL: https://github.com/${OWNER}/${REPO}`);

    } catch (error) {
        console.error('Error during upload:', error.message);
        process.exit(1);
    }
}

main();
