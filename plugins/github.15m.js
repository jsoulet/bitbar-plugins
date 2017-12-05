#!/usr/bin/env /usr/local/bin/node
require('dotenv').config({path: __dirname + '/../.env'});
const bitbar = require('bitbar');
const {renderPrToCheck} =  require('./github/prToCheck');
const {renderMyPr} = require('./github/myPr');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOS = process.env.GITHUB_REPOS.split(',');
const EXCLUDED_LABELS = process.env.EXCLUDED_LABELS.split(',');
if(!GITHUB_TOKEN) {
	return bitBarErrorMessage('You should provide a Github token in the .env file');
}
const main = async () => {
	const prToCheck = await renderPrToCheck(GITHUB_TOKEN, GITHUB_REPOS, EXCLUDED_LABELS);
	const myPr = await renderMyPr(GITHUB_TOKEN, GITHUB_REPOS, EXCLUDED_LABELS);
	bitbar([
		...prToCheck,
		bitbar.sep,
		...myPr
	]);

}
main()


