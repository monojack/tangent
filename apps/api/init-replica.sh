#!/bin/bash
# Wait a few seconds to ensure mongod has started
sleep 5

# Initiate the replica set. This script will run only if the database is empty.
mongosh --eval 'rs.initiate({_id: "rs0", members: [{ _id: 0, host: "localhost:27017" }]});'
