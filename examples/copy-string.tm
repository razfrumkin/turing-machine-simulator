initial state each {
	' ' / ' ', R -> H
	'1' / ' ', R -> sep
}

state sep {
	'1' / '1', R -> self
	' ' / ' ', R -> add
}

state add {
	'1' / '1', R -> self
	' ' / '1', L -> sepL
}

state sepL {
	'1' / '1', L -> self
	' ' / ' ', L -> next
}

state next {
	'1' / '1', L -> self
	' ' / '1', R -> each
}

state H {
	
}