import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const query = '{user(login:"aadi535"){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}';
const result = JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', 'query=' + query], {encoding:'utf8'}));
const calendar = result.data?.user?.contributionsCollection?.contributionCalendar;
if (!calendar?.weeks?.length || !Number.isInteger(calendar.totalContributions)) throw Error('GitHub did not return a contribution calendar');
const days = calendar.weeks.flatMap(w => w.contributionDays);
let longest = 0, run = 0;
for (const day of days) {
  run = day.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
const palette = ['#25344a','#224a72','#2d659d','#468dcb','#9cd3ff'];
const cells = calendar.weeks.map((week,i) => week.contributionDays.map(day => {
  const level = day.contributionCount === 0 ? 0 : Math.min(4, 1 + Math.floor(Math.log2(day.contributionCount)));
  const row = new Date(day.date + 'T00:00:00Z').getUTCDay();
  return '<rect x="'+(42+i*12)+'" y="'+(153+row*12)+'" width="9" height="9" rx="2" fill="'+palette[level]+'"/>';
}).join('')).join('');
const stats = [[42,calendar.totalContributions,'Contributions'],[264,days.filter(d=>d.contributionCount>0).length,'Active days'],[486,longest+' days','Longest streak']];
const labels = stats.map(([x,value,label]) => '<text x="'+x+'" y="98" fill="#a1d5ff" font-size="29" font-weight="700">'+value+'</text><text x="'+x+'" y="120" fill="#c4d3e6" font-size="15">'+label+'</text>').join('');
writeFileSync('assets/development-metrics.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="278" viewBox="0 0 720 278" role="img" aria-labelledby="title"><title id="title">GitHub activity: '+calendar.totalContributions+' contributions and a longest streak of '+longest+' days</title><rect width="720" height="278" rx="18" fill="#151f30"/><g font-family="system-ui,sans-serif"><text x="42" y="43" fill="#eef5ff" font-size="20" font-weight="600">GitHub activity</text><text x="678" y="43" text-anchor="end" fill="#c4d3e6" font-size="14">Past year</text>'+labels+'<path d="M42 137h636" stroke="#34445a"/>'+cells+'<text x="42" y="252" fill="#c4d3e6" font-size="13">Source: GitHub contribution calendar</text></g></svg>\n');
