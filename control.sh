#!/bin/bash

APP_PATH="app.py"
PID_FILE="app.pid"

start() {
    if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE) 2>/dev/null; then
        echo "Application is already running (PID: $(cat $PID_FILE))."
    else
        echo "Starting application..."
        python3 $APP_PATH &
        echo $! > $PID_FILE
        echo "Application started with PID: $(cat $PID_FILE)"
    fi
}

stop() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping application (PID: $PID)..."
            kill $PID
            rm $PID_FILE
            echo "Application stopped."
        else
            echo "PID file exists, but application not running. Cleaning up PID file."
            rm $PID_FILE
        fi
    else
        echo "Application is not running."
    fi
}

restart() {
    echo "Restarting application..."
    stop
    start
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    *)
        echo "Usage: $0 {start|stop|restart}"
        exit 1
esac

exit 0
