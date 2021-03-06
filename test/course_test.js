'use strict';
//During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import {dataBaseFinishSeed} from "../src/finishSeed";

const Course = require('../src/models/course'),
	chai = require('chai'),
	chaiHttp = require('chai-http'),
	server = require('../src/app');


const should = chai.should();
const courseIndexLink = '/api/courses/';
chai.use(chaiHttp);


const validAuth = {
	user: 'joe@smith.com',
	pass: 'password'
};

describe('Courses', () => {
	beforeEach((done) => { //This hangs the tests until databaesFinish seed..
		if(dataBaseFinishSeed){done();} //if it has finished seeding it will hit callback, else forever hangs
		server.on('appStarted', () => { //Once finish seed, set to true and stop hang.
			done();
		});
	});
	/*
	Our GET Tests
	 */
	
	describe('/GET courses', () => {
		it('should GET all the courses', (done) => {
			chai.request(server)
				.get(courseIndexLink)
				.end((err, res) => {
					res.body.should.have.property('message').equal("Courses Successfully retrieved!");
					res.should.have.status(200);
					done();
				});
		});
	});
	
	describe('/GET course', () => {
		it('should GET a course when provided with valid ID', (done) => {
			chai.request(server)
				.get(courseIndexLink+'57029ed4795118be119cc43d')
				.end((err, res) => {
					res.body.should.have.property('message').equal("Course Successfully retrieved!");
					res.should.have.status(200);
					done();
				});
		});
	});
	
	/*
	PUT Tests
	 */
	describe('/PUT courses', () => {
		let course = {
			title: "My first title!",
			description: "My course description",
			user: {
				_id: "57029ed4795118be119cc437"
			},
			steps: [
				{
					title: "step 1",
					description: "My first Updated Step!"
				}
			]
		};
		it('should PUT a course with proper fields and proper auth', (done) => {
			chai.request(server)
				.put(courseIndexLink+'57029ed4795118be119cc43d')
				.auth(validAuth.user, validAuth.pass)
				.send(course)
				.end((err, res) => {
					//res.body.should.have.property('message').equal('Course Successfully Updated!');
					res.should.have.status(204);
					done();
				});
		});
		
		it('should not PUT a course if not authenticated user', (done) => {
			chai.request(server)
				.put(courseIndexLink+'57029ed4795118be119cc43d')
				.auth('InvalidUser'+validAuth.user, validAuth.pass)
				.send(course)
				.end((err, res) => {
					//res.body.should.have.property('message').equal('Course Successfully Updated!');
					res.should.have.status(401);
					done();
				});
		});
	});
	
	/*
	POST Tests
	 */
	describe('/POST courses', () => {
		it('should POST a course with proper fields and proper auth', (done) => {
			let course = {
				title: "My first title!",
				description: "My course description",
				user: {
					_id: "57029ed4795118be119cc437"
				},
				steps: [
					{
						title: "step 1",
						description: "My first Step"
					}
				]
			};
			chai.request(server)
				.post(courseIndexLink)
				.auth(validAuth.user, validAuth.pass)
				.send(course)
				.end((err, res) => {
					res.body.should.have.property('message').equal('Course Successfully added!');
					res.should.have.status(201);
					res.body.should.be.a('object');
					res.body.course.should.have.property('title');
					done();
				});
		});
		
		it('should not POST a course with no fields', (done) => {
			let course = {};
			postCourse(course, done);
		});
		
		it('should not POST a course missing title field', (done) => {
			let course = {
				description: "My course description",
				user: {
					_id: "57029ed4795118be119cc437"
				},
				steps: [
					{
						title: "step 1",
						description: "My first Step"
					}
				]
			};
			postCourse(course, done);
		});
		
		it('should not POST a course missing description field', (done) => {
			let course = {
				title: "my title",
				user: {
					_id: "57029ed4795118be119cc437"
				},
				steps: [
					{
						title: "step 1",
						description: "My first Step"
					}
				]
			};
			postCourse(course, done);
		});
		
		function postCourse(course, done) {
			chai.request(server)
				.post(courseIndexLink)
				.auth(validAuth.user, validAuth.pass)
				.send(course)
				.end((err, res) => {
					//res.body.should.have.property('message').equal("test message");
					res.should.have.status(400);
					done();
				});
		}
	});
	
	describe('/POST courses/:courseId/reviews', () => {
		let review = {
			user: '57029ed4795118be119cc438',
			postedOn: "2016-02-04T21:22:00.000Z",
			rating: 4,
			review: "Lorem ipsum This is a review that I am writing, blah blah blah de blah"
		};
		let courseId = "57029ed4795118be119cc43d";
		
		it('should POST when a review is supplied with proper information and has an authorized user', (done) => {
			successPostReview(courseId, validAuth, review, done);
		});
		
		it('should POST only required attribute for review when supplied with garbage parameters', (done) => {
			let excessReview = review;
			excessReview.extra = 'this is extra param';
			successPostReview(courseId, validAuth, excessReview, done);
		});
		
		it('should not POST when user is not authorized', (done) => {
			let invalidAuth = {
				user: 'invalid@notvalid.com',
				pass: 'notValidPass'
			};
			failPostReview(401, "Access Denied: Wrong email or password", courseId, invalidAuth, review, done);
		});
		
		it('should not POST when review has out of bounds rating', (done) => {
			let badReview = review;
			badReview.rating = 20;
			failPostReview(400, "Review validation failed: rating: Path `rating` (20) is more than maximum allowed value (5).", courseId, validAuth, badReview, done);
		});
		
		it('should not POST when rating is missing', (done) => {
			let badReview = review;
			badReview.rating = null;
			failPostReview(400, "Review validation failed: rating: Path `rating` is required.", courseId, validAuth, badReview, done);
		});
		
		it('should not POST when not supplied with a review', (done) => {
			let badReview = {};
			failPostReview(400, "Review validation failed: rating: Path `rating` is required.", courseId, validAuth, badReview, done);
		});
		
		function successPostReview(courseId, auth, review, done) {
			chai.request(server)
				.post(courseIndexLink+courseId+'/reviews')
				.auth(auth.user, auth.pass)
				.send(review)
				.end((err, res) => {
					res.should.have.status(201);
					done();
				});
		};
		
		function failPostReview(status, msg, courseId, auth, review, done) {
			chai.request(server)
				.post(courseIndexLink+courseId+'/reviews')
				.auth(auth.user, auth.pass)
				.send(review)
				.end((err, res) => {
					res.body.should.have.property('message').equal(msg);
					res.should.have.status(status);
					done();
				});
		};
	});
});