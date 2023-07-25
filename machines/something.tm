initial state "q0" {
    'S', 'S', R -> self
    'A', 'A', R -> self
    '1', 'A', L -> "q1"
    ' ', ' ', R -> "q2"
}

state "q1" {
    'A', 'A', L -> self
    'S', 'S', L -> self
    ' ', 'S', R -> "q0"
}

state "q2" {

}