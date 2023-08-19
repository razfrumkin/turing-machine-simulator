initial state right {
	'1' / '1', R -> self
	'0' / '0', R -> self
	blank / blank, L -> carry
}

state carry {
	'1' / '0', L -> self
	'0' / '1', L -> done
	blank / '1', L -> done
}

state done {
	
}

define blank ' '