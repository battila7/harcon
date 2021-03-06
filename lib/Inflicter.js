let Communication = require('../lib/Communication')
let Barrel = require('../lib/Barrel')
let Blower = require('../lib/Blower')
let Firestormstarter = require('../lib/Firestormstarter')
let Flamestarter = require('../lib/Flamestarter')

let fs = require('fs')
let path = require('path')

let VERSION = exports.VERSION = JSON.parse( fs.readFileSync( path.join(__dirname, '..', 'package.json'), 'utf8' ) ).version
let EXTENSION = { 'harcon': VERSION }

let _ = require('isa.js')

let Assigner = require('assign.js')
let assigner = new Assigner().primitives(['logger'])

let { OK, SEPARATOR } = require('./Static')

function purify ( obj, config, level ) {
	if (!obj) return obj
	if ( _.isDate(obj) || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj) || _.isRegExp(obj) )
		return obj
	if ( _.isFunction(obj) )
		return 'Function...'
	if ( _.isArray(obj) ) {
		let arr = []
		obj.forEach( function ( element ) {
			arr.push( arr.length > config.arrayMaxSize ? '...' : purifyObj( element, config, level + 1 ) )
		} )
		return arr
	}
	if ( _.isObject(obj) ) {
		let res = {}
		for (let key in obj)
			if ( key && obj[key] ) {
				let resObj = level > config.maxLevel ? '...' : purify( obj[key], config, level + 1 )
				if (resObj)
					res[key] = resObj
			}
		return res
	}
	return '...'
}

function purifyObj ( obj, config, level ) {
	if (!obj) return {}
	if ( _.isDate(obj) || _.isBoolean(obj) || _.isNumber(obj) || _.isString(obj) || _.isRegExp(obj) )
		return { message: obj }
	if ( _.isFunction(obj) || _.isArray(obj) || _.isObject(obj) )
		return purify( obj, config, level )
	return {}
}

let PROJECT_ROOT = path.join(__dirname, '..')
function getStackInfo (level, err) {
	if (!err) return {}

	err = err.stack ? err : new Error( err )

	let stackIndex = level || 1
	let stacklist = err.stack.split('\n')
	// let stacklist = (new Error()).stack.split('\n').slice(3)

	let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
	let stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi

	let s = stacklist[stackIndex] || stacklist[0]
	let sp = stackReg.exec(s) || stackReg2.exec(s)

	if (sp && sp.length === 5) {
		return { callstack: {
			method: sp[1],
			relativePath: path.relative(PROJECT_ROOT, sp[2]),
			line: sp[3],
			pos: sp[4],
			file: path.basename(sp[2]),
			stack: stacklist.join('\n')
		} }
	}
}

/**
* Main control point of the messaging system
*
* @class Inflicter
* @constructor
*/
function Inflicter ( options ) {
	let self = this

	self.options = assigner.assign( {}, require('./DefaultConfig'), options || {} )

	self.purifyConfig = { active: !!self.options.purify.active, arrayMaxSize: self.options.purify.arrayMaxSize, maxLevel: self.options.purify.maxLevel }
	self.logger = self.options.logger

	self.logger.harconlog = function ( err, message, obj, level ) {
		if (err)
			this[ 'error' ]( assigner.assign( (self.purifyConfig.active ? purifyObj(obj, self.purifyConfig, 0) : obj) || { }, EXTENSION, self.options.callStackExtension.enabled ? getStackInfo( self.options.callStackExtension.level, err ) : { } ), err.message || err.toString() )
		else
			this[ level || 'debug' ]( assigner.assign( (self.purifyConfig.active ? purifyObj(obj, self.purifyConfig, 0) : obj) || { }, EXTENSION ), message )
	}.bind( self.logger )

}

let inflicter = Inflicter.prototype

inflicter.init = async function () {
	let self = this

	self.logger.harconlog( null, 'Harcon initiating...', { }, 'info' )

	self.setupInflicter()

	self.logger.harconlog( null, 'Barrel creating...', { }, 'info' )

	self.setupBarrel()

	self.logger.harconlog( null, 'Priviledged entities creating...', { }, 'info' )

	self.setupPivileges()

	let barrelConfig = assigner.assign(
		self.options.barrel || {},
		{
			name: self.name, division: self.division, subDivision: self.subDivision, connectedDivisions: self.connectedDivisions, igniteLevel: self.options.igniteLevel, seals: self.options.seals, unfoldAnswer: self.options.unfoldAnswer, idLength: self.options.idLength
		}
	)
	let barrelConfigComp = assigner.assign( {}, barrelConfig, { logger: self.logger, _systemoptions: self.options } )

	self.logger.harconlog( null, 'Barrel initiating...', barrelConfig, 'info' )

	await self.barrel.init( barrelConfigComp )

	self.logger.harconlog( null, 'Barrel starting...', barrelConfig, 'info' )

	await self.kickinBarrel()

	self.logger.harconlog( null, 'Barrel started...', barrelConfig, 'info' )

	self.inflicterEntity = {
		name: 'Inflicter',
		systemEntity: true,
		auditor: true,
		options: self.options,
		Barrel: self.Barrel,
		Blower: self.Blower,
		Firestormstarter: self.Firestormstarter,
		Flamestarter: self.Flamestarter,
		barrel: self.barrel,
		logger: self.logger,
		division: self.division,
		context: self.context,
		conclude: self.conclude,
		deploy: self.deploy,
		deployFunction: self.deployFunction,
		sendNotification: self.sendNotification,
		entityShifted: self.entityShifted,
		divisions: self.divisions,
		entities: self.entities,
		blow: self.blow,
		terms: {},
		affiliate: async function ( division, context, name ) {
			return OK
		},
		affiliated: async function ( division, context, name ) {
			return OK
		},
		entityAppeared: async function ( division, context, name ) {
			if ( self.options.entityAppeared )
				await self.options.entityAppeared( this, division, context, name )

			return OK
		},
		radiated: async function ( division, context, name ) {
			return OK
		},
		vivid: async function ( ) {
			return 'Live'
		},
		castOf: async function ( name, fs ) {
			return OK
		}
	}

	self.logger.harconlog( null, 'Harcon starting...', {}, 'info' )

	await self.deploy( self.inflicterEntity, {} )

	self.barrel.inflicter = self
	self.barrel.systemFirestarter = self.systemFirestarter = self.barrel.firestarter( self.inflicterEntity.name )
	self.logger.harconlog( null, 'Harcon started.', { }, 'info' )

	if (self.options.bender.enabled && self.options.bender.entity) {
		self.logger.harconlog( null, 'Bender starting...', {}, 'info' )

		await self.deploy( require( self.options.bender.entity ), { unfoldAnswer: self.options.unfoldAnswer, igniteTermination: self.options.bender.igniteTermination } )
	}

	if (self.options.mortar.enabled) {
		try {
			let Mortar = require( '../util/Mortar' )
			self.logger.harconlog( null, 'Mortar starting...', {}, 'info' )
			await self.deploy( Mortar.newMortar(), self.options.mortar )
		} catch (err) { self.logger.harconlog( err ) }
	}

	return self
}

inflicter.kickinBarrel = async function ( ) {
	let self = this

	for (let division of self.connectedDivisions) {
		try {
			await self.barrel.newDivision( division )
		} catch (err) { self.logger.harconlog(err) }
	}

	self.inflicterContext = (self.options.environment || {})
	self.inflicterContext._barrel = self.barrel
	self.inflicterContext.logger = self.logger
}

inflicter.setupPivileges = function ( ) {
	let self = this

	if (!self.options.bender.privileged.includes('FireBender'))
		self.options.bender.privileged.push('FireBender')
	if (!self.options.bender.privileged.includes('Inflicter'))
		self.options.bender.privileged.push('Inflicter')
}

inflicter.setupInflicter = function ( ) {
	let self = this

	self.options.name = self.options.name || 'Inflicter'
	self.options.context = self.options.context || self.options.name
	self.options.division = self.options.division || self.options.name
	self.options.subDivision = self.options.subDivision || ''

	self.options.millieu = self.options.millieu || {}

	self.name = self.options.name
	self.context = self.options.context
	self.division = self.options.division
	self.subDivision = self.options.subDivision
	self.connectedDivisions = self.options.connectedDivisions || []

	self.options.idLength = self.options.idLength || 16

	Communication.setupSecurity( self.options.idLength )
}

// 'fatal' 'error' 'warn' 'info' 'debug' 'trace'
exports.createLogger = function ( name, extension, logger ) {
	logger = logger ? ( logger.info ? logger : exports.createPinoLogger( name, logger ) ) : exports.createPinoLogger( name, {} )
	logger[name + 'log'] = function ( err, message, obj, level ) {
		if (err)
			this[ 'error' ]( assigner.assign( obj || { }, extension, getStackInfo( 1, err ) ), err.message || err.toString() )
		else
			this[ level || 'debug' ]( assigner.assign( obj || { }, extension ), message )
	}.bind( logger )

	return logger
}


inflicter.setupBarrel = function ( ) {
	let self = this

	self.Blower = self.options.Blower || Blower

	self.Barrel = self.options.Barrel || Barrel
	self.Firestormstarter = self.options.Firestormstarter || Firestormstarter
	self.Flamestarter = self.options.Flamestarter || Flamestarter

	self.barrel = new self.Barrel( )
}

inflicter.sendNotification = async function ( payload, events ) {
	let self = this
	for (let event of events) {
		await self.inform( null, null, event.division || self.division, event.event, payload )
	}
	return OK
}

inflicter.entityShifted = async function ( component ) {
	let self = this
	if ( _.isString( component.state ) )
		await self.sendNotification( component.state, component.notifyTos[ component.state ] || [] )
	else for (let key of Object.keys(component.state)) { // Object.keys(component.state).forEach( function (key) {
		await self.sendNotification( component.state[key], component.notifyTos[ key ] || [] )
	}
	return OK
}

inflicter.blow = async function ( newComm ) {
	return this.barrel.blow( newComm )
}

inflicter.divisions = async function ( ) {
	let self = this
	let divisions = self.barrel.divisions( )
	return divisions
}

inflicter.entity = async function ( name ) {
	let self = this
	let firestarter = self.barrel.firestarter( name )
	if (firestarter)
		return firestarter.object
	else throw new Error('No such entity exists')
}

inflicter.entities = async function ( division ) {
	let self = this
	let entities = self.barrel.entities( division )
	return entities
}

inflicter.firestarter = async function ( name ) {
	let self = this
	let fs = self.barrel.firestarter( name )
	if ( fs ) return fs
	else throw new Error('No such entity exists')
}

inflicter.listener = async function ( name ) {
	let self = this
	let listener = self.barrel.listener( name )
	if ( listener ) return listener
	else throw new Error('No such entity exists')
}

inflicter.pendingComms = async function ( ) {
	let self = this
	let comms = self.barrel.firestarters.map( function (fs) {
		return fs.blower
	} ). filter( function (blower) { return !!blower } ).map( function (blower) {
		return blower.comms
	})
	return comms
}

/**
* Activates a component
*
* @method activity
* @param {String} name The name of the component to be activated
*/
inflicter.activate = function ( name ) {
	return this.barrel.activity( name, true )
}

/**
* Deactivates a component
*
* @method activity
* @param {String} name The name of the component to be activated
*/
inflicter.deactivate = function ( name ) {
	return this.barrel.activity( name, false )
}

/**
* Unregisters an object-type lister
*
* @method conclude
* @param {Object} object Object
*/
inflicter.conclude = function ( object ) {
	let self = this
	return self.barrel.castOf( object.name )
}

/**
* Deploys a new object-type lister
*
* @method deploys
* @param {Object} object Object
*/
inflicter.deploy = async function ( object, options ) {
	if (options && _.isString(options))
		return this.deployFunction( ...arguments )

	let self = this

	await self.conclude( object )

	let sub = self.options.subDivision ? SEPARATOR + self.options.subDivision : ''

	if (!self.options.suppressing && object.division ) {
		if ( object.division !== self.division && !object.division.startsWith( self.division + SEPARATOR ) )
			object.division = self.division + sub + SEPARATOR + object.division
	}
	else object.division = self.division + sub

	object.inflicterContext = self.inflicterContext
	let blower = new self.Blower( )
	let fss = new self.Firestormstarter( self.options, self.barrel, object, blower, self.logger )

	await blower.init( assigner.assign(self.options.blower || {}, { barrel: self.barrel }) )

	if ( object.init && _.isFunction( object.init ) ) {
		let componentConfig = assigner.assign( {}, process.env, self.options.millieu, self.options[fss.name], options )
		componentConfig.inflicter = self

		try {
			await object.init( componentConfig )
		} catch ( err ) {
			self.logger.error( err, 'Unable to initialize', fss.name )
			await fss.close()
			throw err
		}
	}

	try {
		await self.barrel.affiliate( fss )
	} catch ( err ) {
		self.logger.error( err, 'Unable to affiliate entity', fss.name )
		throw err
	}

	if (object.started)
		await object.started()

	return {
		harcon: self, name: fss.name, context: fss.context, division: fss.division, services: fss.services(), rest: !!object.rest, websocket: !!object.websocket
	}
}

/**
* Deploys a new function-type lister
*
* @method deploy
* @param {String} division, mandatory
* @param {String} name Name of the listener - needed for logging
* @param {String} eventName Eventname subscription
* @param {Function} fn Listener function
*/
inflicter.deployFunction = async function ( division, name, eventName, fn ) {
	let self = this

	let blower = new self.Blower( )

	await blower.init( self.options.blower || {} )

	let flamestarter = new self.Flamestarter( self.options, self.barrel, division || self.division, name, eventName, fn, blower, self.logger )
	let fs = await self.barrel.affiliate( flamestarter )

	return fs
}

/**
* Creates a new event-flow by a starting-event without external ID or division
* The parameter list is a vararg, see parameters below
*
* @method simpleRequest
* @param {String} event Name of the even to emit, mandatory
* @param {String} params A vararg element possessing the objects to be sent with the message. Can be empty
*/
inflicter.simpleRequest = async function ( ...parameters ) {
	let args = [ null, null, this.division ].concat( parameters )
	return this.systemFirestarter.ignite( Communication.MODE_REQUEST, ...args )
}

/**
* Creates a new request event-flow by a starting-event.
* The parameter list is a vararg, see parameters below
*
* @method request
* @param {String} external ID, mandatory, can be null
* @param {String} division, mandatory
* @param {String} event Name of the even to emit, mandatory
* @param {String} params A vararg element possessing the objects to be sent with the message. Can be empty
*/
inflicter.request = async function ( ...parameters ) {
	return this.systemFirestarter.ignite( Communication.MODE_REQUEST, ...parameters )
}


/**
* Creates a new inform event-flow by a starting-event without external ID or division
* The parameter list is a vararg, see parameters below
*
* @method simpleInform
* @param {String} event Name of the even to emit, mandatory
* @param {String} params A vararg element possessing the objects to be sent with the message. Can be empty
*/
inflicter.simpleInform = async function ( ...parameters ) {
	let args = [ null, null, this.division ].concat( parameters )
	return this.systemFirestarter.ignite( Communication.MODE_INFORM, ...args )
}

/**
* Creates a new inform event-flow by a starting-event.
* The parameter list is a vararg, see parameters below
*
* @method inform
* @param {String} external ID, mandatory, can be null
* @param {String} division, mandatory
* @param {String} event Name of the even to emit, mandatory
* @param {String} params A vararg element possessing the objects to be sent with the message. Can be empty
*/
inflicter.inform = async function ( ...parameters ) {
	return this.systemFirestarter.ignite( Communication.MODE_INFORM, ...parameters )
}

/**
* Creates a new delegate event-flow by a starting-event without external ID or division
* The parameter list is a vararg, see parameters below
*
* @method simpleInform
* @param {String} event Name of the even to emit, mandatory
* @param {String} params A vararg element possessing the objects to be sent with the message. Can be empty
*/
inflicter.simpleDelegate = async function ( ...parameters ) {
	let args = [ null, null, this.division ].concat( parameters )
	return this.systemFirestarter.ignite( Communication.MODE_DELEGATE, ...args )
}

/**
* Creates a new delegate event-flow by a starting-event.
* The parameter list is a vararg, see parameters below
*
* @method delegate
* @param {String} external ID, mandatory, can be null
* @param {String} division, mandatory
* @param {String} event Name of the even to emit, mandatory
* @param {String} params A vararg element possessing the objects to be sent with the message. Can be empty
*/
inflicter.delegate = async function ( ...parameters ) {
	return this.systemFirestarter.ignite( Communication.MODE_DELEGATE, ...parameters )
}

/**
* Notifies the harcon event-system to close all open connection
*
* @method close
*/
inflicter.close = async function ( ) {
	this._terminated = true

	await this.barrel.close( )

	if (this.options.close)
		await this.options.close()

	return 'Inflicter closed.'
}

Inflicter.Communication = Communication
Inflicter.Barrel = Barrel
Inflicter.Blower = Blower
Inflicter.Firestormstarter = Firestormstarter
Inflicter.Flamestarter = Flamestarter


module.exports = Inflicter
