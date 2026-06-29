const contract ={
    call(name: string) {
        console.log(`Calling contract function: ${name}`);
    }
};
contract.call("createEscrow");
contract.call("releaseFunds");