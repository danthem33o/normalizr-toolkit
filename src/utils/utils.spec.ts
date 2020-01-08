import { nameof } from './utils';

describe('utils', () => {
	describe('nameof', () => {
		class Entity {}

		it('Should provide name of class', () => {
			expect(nameof(Entity)).toEqual('Entity');
		});
	});
});
