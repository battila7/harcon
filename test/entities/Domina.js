module.exports = {
	name: 'Domina',
	auditor: true,
	// When Julie is woken up, send a gentle message to everyone listening to such messages...  Walter and Pater namely
	force: async function ( terms ) {
		let self = this
		terms.tree = 'grow'
		let res = await terms.request( 0, null, '', 'greet.gentle', 'It is morning!', 'Time to wake up!' )
		let res2 = await terms.request( 1, null, self.division + '.click', 'Claire.simple', 'It is morning!', 'Time to wake up!' )
		return [ res, res2 ]
	},
	permit: async function (message, terms) {
		console.log( this.name + ' permit < ' + message + ' >' )
		return { allowed: false }
	}
}
