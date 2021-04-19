#!/bin/bash

echo "Removing executing containers..."
for container_name in insurer taker laboratory; do
    if [ "$( docker container inspect -f '{{.State.Running}}' catedrabob-spc19-api-$container_name )" == "true" ]; then
        echo "Removing container catedrabob-spc19-api-$container_name ..."
        docker rm -f catedrabob-spc19-api-$container_name
    fi
done

echo "Building image..."
docker build -t catedrabob-spc19-api .

echo "Running container catedrabob-spc19-api-taker..."
docker run -d \
  --name catedrabob-spc19-api-taker \
  -e NODEROLE=taker \
  -e BESUNODEURL=http://spc19-test-network_member2besu_1:8545 \
  -e BESUNODEWSURL=ws://spc19-test-network_member2besu_1:8546 \
  -e BESUNODEPRIVATEKEY=c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3 \
  -p 7082:8080 \
  --network spc19-test-network_quorum-dev-quickstart \
  catedrabob-spc19-api

echo "Waiting to start taker api..."
while [ "`docker inspect -f {{.State.Health.Status}} catedrabob-spc19-api-taker`" != "healthy" ]; do
    echo -n "."
    sleep 1
done
echo "Started catedrabob-spc19-api-taker container!"

echo "Running container catedrabob-spc19-api-insurer..."
docker run -d \
  --name catedrabob-spc19-api-insurer \
  -e NODEROLE=insurer \
  -e BESUNODEURL=http://spc19-test-network_member1besu_1:8545 \
  -e BESUNODEWSURL=ws://spc19-test-network_member1besu_1:8546 \
  -e BESUNODEPRIVATEKEY=8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63 \
  -e SPC19CONTRACTADDRESS=$(docker logs catedrabob-spc19-api-taker | grep "SPC19CONTRACTADDRESS" | sed 's/.*SPC19CONTRACTADDRESS=\(.*\)/\1/') \
  -p 7080:8080 \
  --network spc19-test-network_quorum-dev-quickstart \
  catedrabob-spc19-api

echo "Running container catedrabob-spc19-api-laboratory..."
docker run -d \
  --name catedrabob-spc19-api-laboratory \
  -e NODEROLE=laboratory \
  -e BESUNODEURL=http://spc19-test-network_member3besu_1:8545 \
  -e BESUNODEWSURL=ws://spc19-test-network_member3besu_1:8546 \
  -e BESUNODEPRIVATEKEY=ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f \
  -p 7084:8080 \
  --network spc19-test-network_quorum-dev-quickstart \
  catedrabob-spc19-api