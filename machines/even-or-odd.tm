initial state "q0" {
    '0', '0', R -> "q1"
    ' ', '$', R -> "q2"
}
 
state "q1" {
    '0', '0', R -> "q0"
    ' ', '$', R -> "q3"
}

state "q2" {
    ' ', 'E', R -> "q4"
}

state "q3" {
    ' ', 'O', R -> "q4"
}

state "q4" {
    ' ', '$', R -> "q5"
}

state "q5" {

}