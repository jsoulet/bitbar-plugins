const some = require('lodash/some');
const orderBy = require('lodash/orderBy');
const {sep} = require('bitbar');

const {
	userIsPrReviewer,
	getClientInfo,
	getClientFromToken,
	getPrForRepos
} = require('./utils');

/** 
 * Generate bitbar result
 */
function generateBitbar(repos) {
	if(!some(repos, (repo) => repo.pr.length > 0)) {
		return [
			{
				text: ':sleeping:',
				dropdown: false
			},
			sep,
			{
				text: 'No PR to check'
			}
		];
	}

	const bitmapRenderedRepos = orderBy(repos.map((repo) => {
		
		return {
			text: '(' + repo.pr.length + ') ' + repo.name,
			submenu: repo.pr.map((pr) => {
				return {
					text: pr.title,
					href: pr.html_url
				}
			})
		}
	}), (repo) => repo.pr.length);

	return [
		{
			text:  prNumber + ' PR ' + ':scream:',
			dropdown: false
		},
		sep,
		...bitmapRenderedRepos
	];
}

function bitBarErrorMessage(errorMessage = 'Something went wrong...') {
	return [
			{
				text: ':cry:',
				dropdown: false
			},
			sep,
			{
				text: errorMessage
			}
		];
}

module.exports.renderPrToCheck = async (githubToken, reposNames, labelsToExclude) => {
	const client = getClientFromToken(githubToken);
	const me  = await getClientInfo(client);
	const reposWithPrs = await getPrForRepos(
		reposNames,
		client,
		(pr) => (
			userIsPrReviewer(me, pr) &&
			!some(labelsToExclude, (label) => pr.title.indexOf(`[${label}]`) >= 0)
		)
	);

	if(!reposWithPrs) {
		return bitBarErrorMessage('reposWithPrs failed');
	}

	return generateBitbar(reposWithPrs);	
}
