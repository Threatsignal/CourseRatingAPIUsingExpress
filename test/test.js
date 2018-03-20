'use strict';
process.env.NODE_ENV = 'test';


import { expect } from 'chai'



describe('test', function () {
	it('should pass', function () {
		expect('string').to.be.a('string')
	});
	
	
	it('should set NODE_ENV to equal test', () => {
		expect(process.env.NODE_ENV).to.be.equal('test');
	});
});