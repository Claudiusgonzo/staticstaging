#!/bin/sh
fn=$1

name=`basename $fn .atw`
output=$(node atw.js $fn)
expected=$(sed -n 's/^# -> \(.*\)/\1/p' $fn)

if [ "$expected" = "type error" ] ; then
    echo $output | grep '^type error:' > /dev/null
else
    [ "$output" = "$expected" ]
fi
success=$?

if [ $success -eq 0 ] ; then
    echo $name ✓
else
    echo $name ✘: $output \($expected\)
fi

exit $success
