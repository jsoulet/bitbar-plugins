const github = require('octonode');
const some = require('lodash/some');


function userIsPrReviewer(user, pr) {
	reviewersIds = pr.requested_reviewers.map(reviewers => reviewers.id);

	return reviewersIds.includes(user.id);
}

function getClientInfo(client) {
	return transfromIntoPromise(client.me()['info'], client.me()).catch(() => null);
}

function getPrForRepo(repoName, client) {
	const repo = client.repo(repoName);

	return transfromIntoPromise(repo.prs, repo).catch(() => null);
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

function getClientFromToken(token) {

	return github.client(token);
}


function getPrReviews(pr, client, repoName) {
	const ghpr = client.pr(repoName, pr.number);

	return  transfromIntoPromise(ghpr.reviews, ghpr);
}

async function getPrReview(pr, client, repoName){
	const reviews = await getPrReviews(pr, client, repoName);
	let state = 'REQUEST_CHANGES';

	if(reviews.length === 0) {
		state = 'PENDING';
	} else if(some(reviews, {state: 'APPROVED'})) {
		state = 'APPROVED';
	}

	return {
		...pr,
		globalReview: state
	};
}


async function getPrForRepos(reposNames, client, filter = null) {
	function filterPrs(prs, filter) {
		if(!filter) {

			return prs;
		}

		return prs.filter(filter);
	}

	return (
		// Get all PR for the repo
		await Promise.all(
			reposNames.map(
				async (repoName) => {
					const prs = await getPrForRepo(repoName, client);
					if(!prs) {					
						throw new Error(`Failed to fetch PR for ${repoName}`);
					}

					return {
						name: repoName,
						pr: filterPrs(prs, filter)
					};
				}
			)
		).catch(() => null)
	);
}

module.exports = {
	userIsPrReviewer,
	getClientInfo,
	transfromIntoPromise,
	getClientFromToken,
	getPrForRepos,
	getPrReview
}

