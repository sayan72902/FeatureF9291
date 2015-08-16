Ext.define('FeatureTreeModel', {
    extend: 'Ext.data.TreeModel',
    fields: [
        {name: '_ref',type: 'string'}, {name: '_type',type: 'string'}, 
        {name: 'Name',type: 'string'}, {name: 'Project',type: 'object'}, 
        {name: 'State',type: 'object'}, {name: 'PercentDoneByStoryCount',type: 'double'}, 
        {name: 'FormattedID',type: 'string'}, {name: 'Owner',type: 'object'}, 
        {name: 'c_Customer',type: 'string'}, {name: 'c_LaunchRisk',type: 'object'}, 
        {name: 'c_OriginalLaunch',type: 'object'}, {name: 'c_TargetLaunch',type: 'string'}, 
        {name: 'Notes',type: 'string'}
    ]
});
Ext.define('ProjectTreeModel', {
    extend: 'Ext.data.TreeModel',
    fields: [
        {name: '_ref',type: 'string'}, {name: 'Name',type: 'string'}
    ]
});
Ext.define('HierarchicalRequirementTreeModel', {
    extend: 'Ext.data.TreeModel',
    fields: [
        {name: '_ref',type: 'string'}, {name: '_type',type: 'string'}, 
        {name: 'Name',type: 'string'}, {name: 'Project',type: 'object'}, 
        {name: 'ScheduleState',type: 'string'}, {name: 'FormattedID',type: 'string'}, 
        {name: 'Owner',type: 'object'}, {name: 'Notes',type: 'string'}
    ]
});

/*Created to hold respective collection objects*/
var featureProjectsColl = [];
var projectUserStoriesColl = [];
var userStoriesColl = [];

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this._loadFeatures();
    },
    
    _loadFeatures: function() {
        var that = this;

        /*Filters out Feature records based on State.*/
        var featureFilter = [{
            property: "State.Name",
            //operator: "=",
            value: 'Started'
        }];

        /*Creates a store to hold Feature Records and their associated User Stories. First, features which are filtered by "State" are retrieved. Then, a loop executes, retrieving all User Stories mapped to a particular Feature.*/
        var featureStore = Ext.create('Rally.data.wsapi.Store', {
            model: "PortfolioItem/Feature",
            autoLoad: true,
            filters: featureFilter,
            context: {
                project: this.getContext().getProject()._ref
            },
            fetch: ['Name', 'Project', 'State', 'PercentDoneByStoryCount', 'FormattedID', 'Owner', 'c_LaunchRisk', 'c_OriginalLaunch', 'c_TargetLaunch', 'c_Customer', 'Notes', "UserStories"]
        }).load().then({
            success: this._loadUserStories, // Asynchronous method call to retrieve User Stories by Feature, after all features in state 'Started' have been retrieved.                                 Passes in the store of features as argument.
            scope: this
        }).then({
            success: function(userStories) {
                that._createGrid(userStories); //Function to create a grid from retrieved User Stories. Passes in store of User Stories as argument.
            },
            failure: function() {
                console.log("Wrong");
            }
        });
    },

    _loadUserStories: function(features) {
        var promises = [];                     //Empty array object. Created to hold user stories grouped by feature.
        _.each(features, function(feature) {
            var userStories = feature.get('UserStories');
            if (userStories.Count > 0) {
                userStories.store = feature.getCollection('UserStories' /*{fetch:['Name', 'Project','ScheduleState', 'FormattedID', 'Owner', 'Notes']}*/ );
                promises.push(userStories.store.load());
            }
        });
        return Deft.Promise.all(promises); //Consolidates all user stories into a promise object 
    },

    _createGrid: function(userStories) {
        var that = this;
        var userStoryData = _.flatten(userStories);

        _.each(userStoryData, function(thisUserStory) {

            var thisUserStoryData = thisUserStory.data;
            var featureRecord = thisUserStoryData.Feature;
            var projectRecord = thisUserStoryData.Project;

            if (featureProjectsColl !== null && featureProjectsColl.length > 0) {
                var isPresent = false;
                _.each(featureProjectsColl, function(thisFeatureProject) {
                    var thisFeatureProjectKey = thisFeatureProject.key;
                    if (thisFeatureProjectKey && thisFeatureProjectKey.FormattedID === featureRecord.FormattedID) {
                        projectUserStoriesColl = thisFeatureProject.value;
                        isPresent = true;
                    }
                });
                if (!isPresent) /*If value of isPresent = false*/{
                    projectUserStoriesColl = [];
                    userStoriesColl = [];
                    that._mapUserStoriesToProject(projectRecord, thisUserStoryData);
                    featureProjectsColl.push({
                        key: featureRecord,
                        value: projectUserStoriesColl
                    });
                }
                else {
                    that._mapUserStoriesToProject(projectRecord, thisUserStoryData);
                }
            }
            else {
                that._mapUserStoriesToProject(projectRecord, thisUserStoryData);
                featureProjectsColl.push({
                    key: featureRecord,
                    value: projectUserStoriesColl
                });
            }
        });
        //console.log(featureProjectsColl);
        that._createFeatureTreeStore(_.flatten(featureProjectsColl));
    },

    _mapUserStoriesToProject: function(projectRecord, thisUserStoryData) {

        if (projectUserStoriesColl !== null && projectUserStoriesColl.length > 0) {
            var isPresent = false;
            _.each(projectUserStoriesColl, function(thisProjectUserStory) {
                var thisprojectUserStoryKey = thisProjectUserStory.key;
                if (thisprojectUserStoryKey && thisprojectUserStoryKey._ref === projectRecord._ref) {
                    userStoriesColl = thisProjectUserStory.value;
                    isPresent = true;
                }
            });
            if (!isPresent) /*If value of isPresent = false*/{
                userStoriesColl = [];
                userStoriesColl.push(thisUserStoryData);
                projectUserStoriesColl.push({
                    key: projectRecord,
                    value: userStoriesColl
                });
            }
            else {
                userStoriesColl.push(thisUserStoryData);
            }
        }
        else {
            userStoriesColl.push(thisUserStoryData);
            projectUserStoriesColl.push({
                key: projectRecord,
                value: userStoriesColl
            });
        }
    },

    _createFeatureTreeStore: function(flattenedFeatureProjectsColl) {
        var featureRootNode = Ext.create('FeatureTreeModel', {
            Name: 'Feature Root',
            text: 'Feature Root',
            root: true,
            expandable: true,
            expanded: true
        });
        this._createFeatureNodesWithProjects(featureRootNode, flattenedFeatureProjectsColl);
        var panelHeight = 550;
        var userStoryTreePanel = this._createFeatureTreePanelGrid(featureRootNode, panelHeight);
        this.add(userStoryTreePanel);
    },

    _createFeatureNodesWithProjects: function(featureRootNode, flattenedFeatureProjectsColl) {
        var that = this;
        Ext.Array.each(flattenedFeatureProjectsColl, function(thisFlattenedFeatureProject) {
            var thisFlattenedFeatureProjectKey = thisFlattenedFeatureProject.key;
            var thisFlattenedFeatureProjectValue = thisFlattenedFeatureProject.value;

            var featureTreeNode = that._createFeatureTreeNode(thisFlattenedFeatureProjectKey);
            Ext.Array.each(thisFlattenedFeatureProjectValue, function(thisProjectUserStory) {

                var projectUserStoryTreeNode = that._createProjectUserStoryTreeNode(thisProjectUserStory.key);
                var thisUserStoryCollectionObject = thisProjectUserStory.value;
                var current = that;

                Ext.Array.each(thisUserStoryCollectionObject, function(currentUserStory) {
                    var userStoryTreeNode = current._createUserStoryTreeNode(currentUserStory);
                    projectUserStoryTreeNode.appendChild(userStoryTreeNode);
                });
                featureTreeNode.appendChild(projectUserStoryTreeNode);
            });
            featureRootNode.appendChild(featureTreeNode);
        });
    },

    _createFeatureTreeNode: function(thisFeature) {
        var noEntryText = '--No Entry--';
        var noOwnerText = '--No Owner--';
        var featureTreeNode = Ext.create('FeatureTreeModel', {
            _ref: thisFeature._ref,
            Name: thisFeature.Name,
            FormattedID: thisFeature.FormattedID,
            c_TargetLaunch: this._getFieldText(thisFeature.c_TargetLaunch, '--No Target--'),
            c_LaunchRisk: this._getFieldText(thisFeature.c_LaunchRisk, noEntryText),
            c_OriginalLaunch: this._getFieldText(thisFeature.c_OriginalLaunch, '--No Target--'),
            PercentDoneByStoryCount: thisFeature.PercentDoneByStoryCount,
            Project: this._getFieldText(thisFeature.Project._refObjectName, noEntryText),
            State: (thisFeature.State) ? this._getFieldText(thisFeature.State._refObjectName, noEntryText) : noEntryText,
            Owner: (thisFeature.Owner) ? this._getFieldText(thisFeature.Owner._refObjectName, noEntryText) : noOwnerText,
            c_Customer: this._getFieldText(thisFeature.c_Customer, noEntryText),
            Notes: thisFeature.Notes,
            leaf: (thisFeature._type === 'PortfolioItem/Feature') ? false : true,
            expandable: (thisFeature._type === 'PortfolioItem/Feature') ? true : false,
            expanded: false
                /*iconCls: (thisFeature._type === 'PortfolioItem/Epic') ? 'ico-test-epic' : 'ico-test-feature'*/
        });

        return featureTreeNode;
    },

    _createProjectUserStoryTreeNode: function(thisProjectUserStory) {
        var noEntryText = '--No Entry--';
        var noOwnerText = '--No Owner--';
        var projectUserStoryTreeNode = Ext.create('ProjectTreeModel', {
            _ref: thisProjectUserStory._ref,
            Name: thisProjectUserStory.Name,
            Owner: (thisProjectUserStory.Owner) ? this._getFieldText(thisProjectUserStory.Owner._refObjectName, noEntryText) : noOwnerText,
            Notes: thisProjectUserStory.Notes,
            expandable: (thisProjectUserStory._type === 'Project') ? true : false,
            expanded: false
        });
        return projectUserStoryTreeNode;
    },

    _createUserStoryTreeNode: function(thisUserStory) {
        var noEntryText = '--No Entry--';
        var noOwnerText = '--No Owner--';
        var userStoryTreeNode = Ext.create('HierarchicalRequirementTreeModel', {
            _ref: thisUserStory._ref,
            Name: thisUserStory.Name,
            FormattedID: thisUserStory.FormattedID,
            Project: this._getFieldText(thisUserStory.Project._refObjectName, noEntryText),
            ScheduleState: thisUserStory.ScheduleState,
            Owner: (thisUserStory.Owner) ? this._getFieldText(thisUserStory.Owner._refObjectName, noEntryText) : noOwnerText,
            Notes: thisUserStory.Notes,
            expandable: (thisUserStory._type === 'HierarchicalRequirement') ? true : false
        });
        return userStoryTreeNode;
    },

    _createFeatureTreePanelGrid: function(featureRootNode, panelHeight) {
        var userStoryTreeStore = Ext.create('Ext.data.TreeStore', {
            model: 'FeatureTreeModel',
            root: featureRootNode

        });
        var userStoryItemTreePanel = Ext.create('Ext.tree.Panel', {
            store: userStoryTreeStore,
            useArrows: true,
            lines: false,
            displayField: 'FormattedID',
            rootVisible: false,
            width: '100%',
            height: 'auto', // Extra scroll for individual sections:
            columns: [{
                    xtype: 'treecolumn',
                    text: 'ID',
                    dataIndex: 'FormattedID',
                    width: 100
                }, {
                    text: 'Name',
                    dataIndex: 'Name',
                    width: 300
                },


                {
                    text: 'Project',
                    dataIndex: 'Project',
                    width: 150
                }, {
                    text: 'State',
                    dataIndex: 'ScheduleState',
                    width: 100
                }, {
                    text: 'Owner',
                    dataIndex: 'Owner',
                    width: 150
                }

                /*{
                    xtype: 'actioncolumn',
                    text: 'Notes',
                    width: 50,
                    items: [{
                        icon: 'https://cdn3.iconfinder.com/data/icons/developerkit/png/View.png', // Use a URL in the icon config
                        width: 75,
                        tooltip: 'View',
                        handler: function(grid, rowIndex, colIndex) {
                            var columnIndex = that._getColumnIndex(grid, 'Notes');
                            if (colIndex == columnIndex) {
                                //popup window code.
                                var record = grid.getStore().getAt(rowIndex);
                                that._displayNotesDailog(record);
                            }
                        }
                    }]
                }*/
            ]
        });

        return userStoryItemTreePanel;
    },

    _getFieldText: function(fieldValue, defaultValue) {
        return _.isUndefined(fieldValue) || _.isNull(fieldValue) ? defaultValue : fieldValue;
    }
});
