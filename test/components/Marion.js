var async = require('async')

module.exports = {
	name: 'Marion',
	auditor: true,
	// When Julie is woken up, send a gentle message to everyone listening to such messages...  Walter and Pater namely
	force: function ( terms, ignite, callback ) {
		var self = this
		async.series([
			terms.erupt( 0, '', 'greet.gentle', 'It is morning!', 'Time to wake up!'),
			terms.erupt( 1, self.division + '.click', 'Claire.simple', 'It is morning!', 'Time to wake up!')
		], callback )
	}
}