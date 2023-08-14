initial state "right" {
	'1', '1', R -> self
	'0', '0', R -> self
	' ', ' ', L -> "carry"
}

state "carry" {
	'1', '0', L -> self
	'0', '1', L -> "done"
	' ', '1', L -> "done"
}

state "done" {
	
}