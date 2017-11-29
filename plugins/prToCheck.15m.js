#!/usr/bin/env /usr/local/bin/node
require('dotenv').config({path: __dirname + '/../.env'});
const bitbar = require('bitbar');
const github = require('octonode');
const some = require('lodash/some');

async function getLoggedUserInfo(client) {
	return await getMyInfo(client);
}

function userIsPrReviewer(user, pr) {
	reviewersIds = pr.requested_reviewers.map(reviewers => reviewers.id);
	return reviewersIds.indexOf(user.id) >= 0;
}

function getMyInfo(client) {
	return transfromIntoPromise(client.me()['info'], client.me());
}

function getOpenPrForRepo(repo) {
	return transfromIntoPromise(repo.prs, repo);
}

/** 
 * Helper to wrap octonode callbacks with Promise
 */
function transfromIntoPromise(func, context) {
	const handler = func.bind(context);
	return new Promise((resolve, reject) => {
		handler((error, data, headers) => {
			if(error) {
				return reject(error);
			}
			return resolve(data)
		});
	});
}

/** 
 * Generate bitbar result
 */
function generateBitbar(repos) {
	if(repos.length === 0) {
		bitbar([
			{
				text: ':sleeping:',
				dropdown: false
			}
		])
	}

	const prNumber = repos.reduce((result, repo) => {
		return result + repo.pr.length;
	}, 0);

	const bitmapRenderedRepos = repos.map((repo) => {
		
		return {
			text: '(' + repo.pr.length + ') ' + repo.name,
			submenu: repo.pr.map((pr) => {
				return {
					text: pr.title,
					href: pr.html_url
				}
			})
		}
	});

	const bitbarMenu = [
		{
			text:  prNumber + ' PR ' + ':scream:',
			dropdown: false
		},
		bitbar.sep,
		...bitmapRenderedRepos
	]

	bitbar(bitbarMenu);
}

const renderPrToCheck = async (githubToken, reposNames, labelsToExclude) => {
	const client = github.client(githubToken);

	const me  = await getLoggedUserInfo(client);

	const reposWithPrs = (
			// Get all PR for the repo
			await Promise.all(
				reposNames.map(
					async (repoName) => {
						const repo = client.repo(repoName);
						openPrForRepo = await getOpenPrForRepo(repo);
						return {
							name: repo.name,
							pr: openPrForRepo
						};
					}
				)
			).catch(e => console.log('ERROR', e))
		)
		.reduce(
			// Clean PR list to keep only those with PR assigned to user
			(result, repo) => {
				const assignedPr = repo.pr.filter((pr) => userIsPrReviewer(me, pr));
				const filteredPr = assignedPr.filter((pr) => !some(labelsToExclude, (label) => pr.title.indexOf(`[${label}]`) >= 0));

				if(filteredPr.length === 0) {
					return result
				}

				result.push({
					name: repo.name,
					pr: filteredPr
				});
			return result
			},
			[]
		);

	generateBitbar(reposWithPrs);
}
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOS = process.env.GITHUB_REPOS.split(',');
const EXCLUDED_LABELS = process.env.EXCLUDED_LABELS.split(',');
if(!GITHUB_TOKEN) {
	throw new Error('You should provide a Github token in the .env file');
}
renderPrToCheck(GITHUB_TOKEN, GITHUB_REPOS, EXCLUDED_LABELS);