# Protocol installation for Windows

Please make sure the prerequisites as mentioned in the
[top document](INSTALLATION.md) are installed first.

# Using the runtime version

## Front End system

## Services

1. get the services from `https://github.com/kiva/protocol-integration-tests`
2. Run the following command to manually pull the latest bcgov image:
```
docker pull bcgovimages/aries-cloudagent:py36-1.16-1_0.7.1
```
3, to start the services,


# Using the code base
The code base is broken up into more granular components.  These instructions will get
you started.  Keep in mind several of components are broken out into other repos so making
changes to those components will require additional setup.  Please see below.

## Front End system

## Services
The best place to start is with the [protocol-aries code base](https://github.com/kiva/protocol-aries).

1. follow protocol-aries [setup instructions](https://github.com/kiva/protocol-aries#setup) for setup.
2. and for running the services.

### Additional components for the services
[aries-guardianship-agency](https://github.com/kiva/aries-guardianship-agency)    
[aries-key-guardian](https://github.com/kiva/aries-key-guardian.git)    
[protocol-common](https://github.com/kiva/protocol-common.git)    
[protocol](https://github.com/kiva/protocol.git)  


