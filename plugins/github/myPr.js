const {
	//userIsPrReviewer,
	getClientInfo,
	getClientFromToken,
	getPrForRepos,
	getPrReview
} = require('./utils');

const every = require('lodash/every');
const some = require('lodash/some');

const generateBitbar = (repos) => {
	if(every(repos, (repo) => repo.pr.length === 0)) {
		return [{
			text: 'No pending PR'
		}]
	}

	const REVIEW_EMOJI_MAPPING = {
		APPROVED: ':green_heart:',
		PENDING: ':hourglass_flowing_sand:',
		REQUEST_CHANGES: ':broken_heart:'
	};

	const formattedPrList = repos.reduce((result, repo) => {
		const prForRepo = repo.pr.map((pr) => {

		return {
			text: `${REVIEW_EMOJI_MAPPING[pr.globalReview]} ${pr.title}` ,
			href: pr.html_url
		}

		});

		return [...result, ...prForRepo];
	}, []);
	return [{
		text: formattedPrList.length + ' pending PR',
		submenu: formattedPrList
	}]
}

module.exports.renderMyPr = async (githubToken, reposNames, labelsToExclude) => {
	const client = getClientFromToken(githubToken);
	const me  = await getClientInfo(client);

	const myPrsByRepo = await getPrForRepos(reposNames, client, (repo) => repo.user.id === me.id);

	const reposWithPrApprouval = await Promise.all(myPrsByRepo.map(
		async (repo) => {
			const prWithApprouval = await Promise.all(repo.pr.map(
				async (pr) => {return await getPrReview(pr, client, repo.name)}
			));

			return {
				...repo,
				pr: prWithApprouval
			};
		})
	);

	return generateBitbar(reposWithPrApprouval);
}
