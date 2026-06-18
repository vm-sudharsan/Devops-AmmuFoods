pipeline {
    agent any

    environment{
        DOCKERHUB_USERNAME = "sudharsanprakalathanvm"
    }

    stages {
        stage('Verify Tools')
        {
            steps{
                bat 'git --version'
                bat 'docker --version'
            }
        }

        stage('Build Backend Image')
        {
            steps{
                dir('backend')
                {
                    bat 'docker build -t ammu-backend:latest .'
                }
            }
        }

        stage('Build Frontend Image')
        {
            steps{
                dir('frontend')
                {
                    bat 'docker build -t ammu-frontend:latest .'
                }
            }
        }

        stage('Tag Images')
        {
            steps{
                
                
                bat 'docker tag ammu-backend:latest %DOCKERHUB_USERNAME%/ammufoods-backend:latest'

                bat 'docker tag ammu-frontend:latest %DOCKERHUB_USERNAME%/ammufoods-frontend:latest'
            }
        }

        // Stage 1 testing of Jenkins Workflow 
        // stage('Verify Git') {
        //     steps {
        //         bat 'git --version'
        //     }
        // }

        // stage('Verify Docker') {
        //     steps {
        //         bat 'docker --version'
        //     }
        // }


    }
}