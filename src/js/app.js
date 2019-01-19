App = {
  web3Provider: null,
  contracts: {},
  startTallying: false,
  init: function() {
    return App.initWeb3();
  },

  // Instance Web3
  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      // Only useful in a development environment
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  // Instance contract
  initContract: function() {
    $.getJSON('Voting.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.Voting = TruffleContract(data);
      // Set the provider for our contract
      App.contracts.Voting.setProvider(App.web3Provider);
      // Use our contract to retrieve value data
      App.getProposals();
    });
    return App.bindEvents();
  },

  bindEvents: function() {

    $(document).on('click', '.btn-value', function(e){
      var $this = $(this);
      $this.button('loading');
      App.handleAddProposal(e);
    });

    $(document).on('click', '.btn-vote', function(e) {
      console.log(e);
      var $this = $(this);
      $this.button('loading');
      App.handleAddVote(e);
    });

//process of tallying、can use only addministrator
    $(document).on('click', '.btn-tallying', function(e) {
      console.log(e);
      var $this = $(this);
      $this.button('loading');
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        var account = accounts[0];
        App.contracts.Voting.deployed().then(function(instance) {
          tallyingInstance = instance;
          tallyingInstance.getAdminAddress.call().then(function(addminAddress){
            if(account == addminAddress) {
              App.startTallying = true;
            }
            else {
              alert('管理者のみが開票を行うことができます');
            }
        });
      });
    });
      App.getProposals();
    });

//decide random value
    $(document).on('click', '#register', function(e) {
      console.log(e);
      var $this = $(this);
      $this.button('loading');
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        var account = accounts[0];
        App.contracts.Voting.deployed().then(function(instance) {
          registerInstance = instance;
          return registerInstance.setRandomValue(account,{from: account}).then(function(result){


        }).catch(function(err) {
          console.log(err.message);
          $('button').button('reset');
        });
      });
    });
    App.getProposals();
    });

  },

  getProposals: function() {
    var proposalsInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.Voting.deployed().then(function(instance) {
        proposalsInstance = instance;
        proposalsInstance.getNumProposals.call().then(function(numProposals) {
          var wrapperProposals = $('#wrapperProposals');
          wrapperProposals.empty();
          var proposalTemplate = $('#proposalTemplate');
          for (var i=0; i<numProposals; i++) {
            proposalsInstance.getProposal.call(i).then(function(data) {
              var idx = data[0];
              proposalTemplate.find('.panel-title').text(data[1]);

              //開票
              if(App.startTallying == true) {
                proposalTemplate.find('.numVotes').text(data[2]);
              }
              //ランダム値記述
              proposalsInstance.getRandomValue.call(account).then(function(random){
                if (random != 0) {
                  console.log(random)
                $('.randomvalue').text(random);
              }
              });


              proposalTemplate.find('.btn-vote').attr('data-proposal', idx);


              proposalsInstance.getIsVoted.call(account).then(function(isVoted) {
                console.log(isVoted);
                if (isVoted == true) {
                    console.log("in if")
                    wrapperProposals.find('.btn-vote').prop('disabled', true);
                    console.log(proposalTemplate.find('.btn-vote'))
                  }
                  else {
                    console.log("in else")
                    wrapperProposals.find('.btn-vote').p('disabled', false);
                  }
              }).catch(function(err) {
                console.log(err.message);
              });


              wrapperProposals.append(proposalTemplate.html());
            }).catch(function(err) {
              console.log(err.message);
            });
          }
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    });
    $('button').button('reset');

  },

  handleAddProposal: function(event) {
    event.preventDefault();
    var proposalInstance;
    var value = $('.input-value').val();
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Voting.deployed().then(function(instance) {
        proposalInstance = instance;

        proposalInstance.getAdminAddress.call().then(function(addminAddress){
          if(account == addminAddress) {
            return proposalInstance.addProposal(value, {from: account});
          }
          else {
            alert('管理者のみが候補者を追加できます。');
            return false;
          }
        })


      }).then(function(result) {
        var event = proposalInstance.CreatedProposalEvent();
        App.handleEvent(event);
        $('.input-value').val(''); // clean input
      }).catch(function(err) {
        console.log(err.message);
        $('button').button('reset');
      });
    });
  },

  handleAddVote: function(event) {
    event.preventDefault();
    var voteInstance;
    var voteValue = parseInt($(event.target).data('vote'));
    var proposalInt = parseInt($(event.target).data('proposal'));
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Voting.deployed().then(function(instance) {
        voteInstance = instance;
        console.log("instance log");

        console.log(proposalInt);

        voteInstance.getRandomValue.call(account).then(function(random){
          randomValue = random;
          console.log(randomValue);
          randomedProposal = String(parseInt(proposalInt,10) + parseInt(randomValue,10))
          console.log(randomedProposal);

          return voteInstance.vote(randomedProposal,{from: account});
        }).then(function(result) {

          var event = voteInstance.CreatedVoteEvent();
          console.log("result log");
          App.handleEvent(event);
        }).catch(function(err) {
          console.log(err.message);
          $('button').button('reset');
        });
      });
    });
  },

  handleEvent: function(event) {
    console.log('Waiting for a event...');
    event.watch(function(error, result) {
      if (!error) {
        App.getProposals();
      } else {
        console.log(error);
      }
      event.stopWatching();
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
