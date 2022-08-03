import axios from 'axios';

axios
	.get(
		'https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=6a2b7e54c6168fcf0d622cbc979b'
	)
	.then((response) => {
		const apiData = response.data;

		// create an object to hold sessions by user
		const sessions = {
			sessionsByVisitor: apiData.events.reduce((prevValue, currValue) => {
				(prevValue[currValue['visitorId']] =
					prevValue[currValue['visitorId']] || []).push(currValue);
				return prevValue;
			}, {}),
		};
		// console.log(sessions);

		// sort visits in descending order
		for (const key in sessions.sessionsByVisitor) {
			let visits = sessions.sessionsByVisitor[key];
			visits = visits.sort((a, b) => {
				return a.timestamp - b.timestamp;
			});
		}
		// console.log(sessions)

		// restructure into visitor sessions (incl. duration, pages, and start time)
		const visitorSessions = {};
		for (const key in sessions.sessionsByVisitor) {
			const visits = sessions.sessionsByVisitor[key];
			let prevIndex = 0;
			for (let i = 0; i < visits.length; i++) {
				if (i == 0) {
					visitorSessions[key] = [
						{
							duration: 0,
							pages: [visits[i].url],
							startTime: visits[i].timestamp,
						},
					];
				} else {
					// check for 10 minutes in between visit
					if (visits[i].timestamp - visits[i - 1].timestamp < 600000) {
						const visit = visitorSessions[key][prevIndex];
						visit.duration += visits[i].timestamp - visits[i - 1].timestamp;
						visit.pages.push(visits[i].url);
					} else {
						visitorSessions[key].push({
							duration: 0,
							pages: [visits[i].url],
							startTime: visits[i].timestamp,
						});
						prevIndex++;
					}
				}
			}
		}
		// console.log(visitorSessions)

		const result = {
			sessionsByUser: visitorSessions,
		};

		axios
			.post(
				'https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=6a2b7e54c6168fcf0d622cbc979b',
				result
			)
			.then((response) => {
				console.log('here is the API response:', response);
			})
			.catch((err) => {
				console.log('Error in POST request to API: ', err);
			});
	})
	.catch((err) => {
		console.log('Error in GET request to API: ', err);
	});
